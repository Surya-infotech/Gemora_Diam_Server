const { Server } = require("socket.io");
const ChatConversation = require("../models/chat-conversation-model");
const ChatMessage = require("../models/chat-message-model");
const { scheduleUnreadCheck, cancelUnreadCheck } = require("../utils/chatNotificationScheduler");

let io = null;

const initSocketServer = (httpServer, corsOptions) => {
    io = new Server(httpServer, {
        cors: {
            origin: corsOptions.origin,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on("connection", (socket) => {
        // 1. Join a specific conversation room
        socket.on("join_conversation", async (data) => {
            try {
                const conversationId = typeof data === "string" ? data : data?.conversationId;
                if (!conversationId) return;

                const roomName = `conversation_${conversationId}`;
                socket.join(roomName);

                // Optional: notify others in the room
                socket.to(roomName).emit("user_joined", {
                    conversationId,
                    socketId: socket.id,
                    user: data?.user || null
                });
            } catch (err) {
                console.error("[Socket] Error joining conversation:", err);
            }
        });

        // 2. Leave conversation room
        socket.on("leave_conversation", (conversationId) => {
            if (!conversationId) return;
            socket.leave(`conversation_${conversationId}`);
        });

        // 3. Admin joins the global support channel (to receive notifications across all chats)
        socket.on("join_admin_support", () => {
            socket.join("admin_support_channel");
        });

        // 4. Send Message event
        socket.on("send_message", async (payload, callback) => {
            try {
                const {
                    conversationId,
                    senderType, // "customer" | "admin" | "guest" | "system"
                    senderId,
                    senderName,
                    message,
                    messageType = "text",
                    attachmentUrl = ""
                } = payload || {};

                if (!conversationId || (!message && !attachmentUrl)) {
                    if (typeof callback === "function") {
                        return callback({ success: false, error: "Invalid message payload" });
                    }
                    return;
                }

                // Create message record
                const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                const newMessage = new ChatMessage({
                    messageId,
                    conversationId,
                    senderType: senderType || "customer",
                    senderId: senderId || "",
                    senderName: senderName || "Visitor",
                    message: message || "",
                    messageType,
                    attachmentUrl,
                    isRead: false,
                    createdAt: new Date().toISOString()
                });

                await newMessage.save();

                // Update conversation metadata
                const isCustomerSide = senderType === "customer" || senderType === "guest";
                const displayMsg = messageType === "image" ? "📷 Image" : message;

                const updateFields = {
                    lastMessage: displayMsg,
                    lastMessageAt: new Date().toISOString(),
                    lastMessageSender: senderType || "customer",
                    updatedAt: new Date().toISOString()
                };

                const updateQuery = {
                    $set: updateFields,
                    $inc: isCustomerSide ? { unreadCountAdmin: 1 } : { unreadCountCustomer: 1 }
                };

                const updatedConv = await ChatConversation.findOneAndUpdate(
                    { conversationId },
                    updateQuery,
                    { new: true }
                );

                const roomName = `conversation_${conversationId}`;

                // Broadcast message to everyone in the conversation room
                io.to(roomName).emit("new_message", {
                    message: newMessage,
                    conversationId
                });

                // Schedule email notification if recipient does not read within 5 minutes
                scheduleUnreadCheck({
                    conversationId,
                    senderType: newMessage.senderType
                });

                // If sent by customer/guest, notify all admins on the support dashboard
                if (isCustomerSide) {
                    io.to("admin_support_channel").emit("notify_admin_inbox", {
                        conversationId,
                        lastMessage: displayMsg,
                        senderName: senderName || "Visitor",
                        conversation: updatedConv
                    });
                }

                if (typeof callback === "function") {
                    callback({ success: true, message: newMessage });
                }
            } catch (error) {
                console.error("[Socket] Error sending message:", error);
                if (typeof callback === "function") {
                    callback({ success: false, error: error.message });
                }
            }
        });

        // 5. Typing indicator
        socket.on("typing_start", (data) => {
            const { conversationId, senderType, senderName } = data || {};
            if (!conversationId) return;
            socket.to(`conversation_${conversationId}`).emit("user_typing", {
                conversationId,
                senderType,
                senderName
            });
        });

        socket.on("typing_stop", (data) => {
            const { conversationId, senderType, senderName } = data || {};
            if (!conversationId) return;
            socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
                conversationId,
                senderType,
                senderName
            });
        });

        // 6. Mark messages as read
        socket.on("mark_messages_read", async (data) => {
            try {
                const { conversationId, readerType } = data || {}; // readerType: "admin" | "customer"
                if (!conversationId || !readerType) return;

                const filter = { conversationId, isRead: false };
                if (readerType === "admin") {
                    filter.senderType = { $in: ["customer", "guest"] };
                } else {
                    filter.senderType = "admin";
                }

                const nowIso = new Date().toISOString();
                await ChatMessage.updateMany(filter, {
                    $set: { isRead: true, readAt: nowIso }
                });

                const resetUnread = readerType === "admin"
                    ? { unreadCountAdmin: 0 }
                    : { unreadCountCustomer: 0 };

                await ChatConversation.findOneAndUpdate(
                    { conversationId },
                    { $set: resetUnread }
                );

                // Cancel pending 5-minute unread email alert since recipient read the messages
                cancelUnreadCheck(conversationId, readerType);

                const roomName = `conversation_${conversationId}`;
                io.to(roomName).emit("messages_read", {
                    conversationId,
                    readerType,
                    readAt: nowIso
                });

                if (readerType === "admin") {
                    io.to("admin_support_channel").emit("admin_inbox_updated", {
                        conversationId
                    });
                }
            } catch (err) {
                console.error("[Socket] Error marking messages read:", err);
            }
        });

        socket.on("disconnect", () => {
            // Clean up socket
        });
    });

    return io;
};

const getIO = () => {
    return io;
};

module.exports = {
    initSocketServer,
    getIO
};
