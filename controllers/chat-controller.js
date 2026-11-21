const ChatConversation = require("../models/chat-conversation-model");
const ChatMessage = require("../models/chat-message-model");
const Customer = require("../models/customer-model");
const { getIO } = require("../socket");
const { scheduleUnreadCheck, cancelUnreadCheck } = require("../utils/chatNotificationScheduler");

/**
 * Initiate or resume a conversation for a customer or guest visitor.
 */
const initiate_conversation = async (req, res) => {
    try {
        const {
            guestId,
            name,
            email,
            phone = "",
            initialMessage = ""
        } = req.body;

        const customer = req.customer; // Available if authenticated via customerOrAdminAuth
        let numericCustomerId = customer?.customerid;
        let customerDocId = customer?._id;

        // Try to locate existing conversation
        let conversation = null;

        if (customerDocId || numericCustomerId) {
            conversation = await ChatConversation.findOne({
                $or: [
                    { customer: customerDocId },
                    { customerId: numericCustomerId }
                ]
            }).sort({ lastMessageAt: -1 });
        } else if (guestId) {
            conversation = await ChatConversation.findOne({
                guestId: String(guestId).trim()
            }).sort({ lastMessageAt: -1 });
        }

        // If no conversation, create a new one
        if (!conversation) {
            const finalName = name || customer?.fullname || "Visitor";
            const finalEmail = email || customer?.email || (guestId ? `guest_${guestId.substring(0, 8)}@gemoradiam.com` : "visitor@gemoradiam.com");
            const finalPhone = phone || customer?.phone || "";

            const conversationId = `CONV_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            conversation = new ChatConversation({
                conversationId,
                customer: customerDocId || null,
                customerId: numericCustomerId || null,
                guestId: guestId ? String(guestId).trim() : null,
                customerName: finalName,
                customerEmail: finalEmail,
                customerPhone: finalPhone,
                lastMessage: initialMessage ? initialMessage.trim() : "Conversation started",
                lastMessageAt: new Date().toISOString(),
                lastMessageSender: customerDocId || guestId ? "customer" : "system",
                unreadCountAdmin: initialMessage ? 1 : 0,
                unreadCountCustomer: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            await conversation.save();

            // If initial message provided, save it as first message
            if (initialMessage && initialMessage.trim()) {
                const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                const firstMsg = new ChatMessage({
                    messageId,
                    conversationId: conversation.conversationId,
                    senderType: customerDocId ? "customer" : "guest",
                    senderId: customerDocId ? String(customerDocId) : (guestId || ""),
                    senderName: finalName,
                    message: initialMessage.trim(),
                    messageType: "text",
                    createdAt: new Date().toISOString()
                });
                await firstMsg.save();

                // Schedule 5-minute unread email alert
                scheduleUnreadCheck({
                    conversationId: conversation.conversationId,
                    senderType: firstMsg.senderType
                });

                // Alert admin support room
                const io = getIO();
                if (io) {
                    io.to("admin_support_channel").emit("notify_admin_inbox", {
                        conversationId: conversation.conversationId,
                        lastMessage: initialMessage.trim(),
                        senderName: finalName,
                        conversation
                    });
                }
            }
        }

        // Fetch recent messages for this conversation
        const messages = await ChatMessage.find({ conversationId: conversation.conversationId })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

        return res.status(200).json({
            success: true,
            conversation,
            messages
        });
    } catch (error) {
        console.error("Error initiating chat conversation:", error);
        return res.status(500).json({ success: false, message: "Failed to initiate conversation" });
    }
};

/**
 * Fetch messages for a specific conversation (paginated).
 */
const get_messages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        if (!conversationId) {
            return res.status(400).json({ success: false, message: "conversationId is required" });
        }

        // If requested by admin, automatically mark customer messages as read
        const isAdmin = Boolean(req.user || req.originalUrl?.includes("/Admin/"));
        if (isAdmin) {
            const nowIso = new Date().toISOString();
            await Promise.all([
                ChatMessage.updateMany(
                    { conversationId, senderType: { $in: ["customer", "guest"] }, isRead: false },
                    { $set: { isRead: true, readAt: nowIso } }
                ),
                ChatConversation.findOneAndUpdate(
                    { conversationId },
                    { $set: { unreadCountAdmin: 0 } }
                )
            ]);

            const io = getIO();
            if (io) {
                io.to(`conversation_${conversationId}`).emit("messages_read", {
                    conversationId,
                    readerType: "admin",
                    readAt: nowIso
                });
                io.to("admin_support_channel").emit("admin_inbox_updated", {
                    conversationId
                });
            }
        }

        const [messages, total] = await Promise.all([
            ChatMessage.find({ conversationId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChatMessage.countDocuments({ conversationId })
        ]);

        return res.status(200).json({
            success: true,
            messages: messages.reverse(),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
};

/**
 * Explicit endpoint to mark all messages in a conversation as read by Admin.
 */
const mark_admin_read = async (req, res) => {
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ success: false, message: "conversationId is required" });
        }

        const nowIso = new Date().toISOString();
        await Promise.all([
            ChatMessage.updateMany(
                { conversationId, senderType: { $in: ["customer", "guest"] }, isRead: false },
                { $set: { isRead: true, readAt: nowIso } }
            ),
            ChatConversation.findOneAndUpdate(
                { conversationId },
                { $set: { unreadCountAdmin: 0 } }
            )
        ]);

        const io = getIO();
        if (io) {
            io.to(`conversation_${conversationId}`).emit("messages_read", {
                conversationId,
                readerType: "admin",
                readAt: nowIso
            });
            io.to("admin_support_channel").emit("admin_inbox_updated", {
                conversationId
            });
        }

        return res.status(200).json({ success: true, message: "Messages marked as read" });
    } catch (error) {
        console.error("Error marking admin read:", error);
        return res.status(500).json({ success: false, message: "Failed to mark read" });
    }
};

/**
 * Admin: Get or create conversation for a customer (e.g. from OrderDetails)
 */
const admin_get_or_create_conversation = async (req, res) => {
    try {
        const { conversationId, email, customerId, name, phone } = req.body || {};

        if (!conversationId && !email && !customerId) {
            return res.status(400).json({ success: false, message: "Customer email, ID, or conversationId is required" });
        }

        let conversation = null;

        if (conversationId) {
            conversation = await ChatConversation.findOne({ conversationId });
        }

        if (!conversation) {
            const normalizedEmail = (email || "").trim().toLowerCase();
            const orConditions = [];
            if (normalizedEmail) {
                orConditions.push({ customerEmail: normalizedEmail });
            }
            if (customerId) {
                orConditions.push({ customerId: Number(customerId) });
            }

            if (orConditions.length > 0) {
                conversation = await ChatConversation.findOne({ $or: orConditions }).sort({ lastMessageAt: -1 });
            }

            if (!conversation) {
                let customerDoc = null;
                if (customerId) {
                    customerDoc = await Customer.findOne({ customerid: Number(customerId) });
                } else if (normalizedEmail) {
                    customerDoc = await Customer.findOne({ email: normalizedEmail });
                }

                const finalName = name || customerDoc?.fullname || "Customer";
                const finalEmail = normalizedEmail || customerDoc?.email || "";
                const finalPhone = phone || customerDoc?.phone || "";
                const finalCustomerId = customerId || customerDoc?.customerid || null;
                const customerDocId = customerDoc?._id || null;

                const newConvId = `CONV_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

                conversation = new ChatConversation({
                    conversationId: newConvId,
                    customer: customerDocId,
                    customerId: finalCustomerId,
                    customerName: finalName,
                    customerEmail: finalEmail,
                    customerPhone: finalPhone,
                    lastMessage: "Chat initiated from Order Details",
                    lastMessageAt: new Date(),
                    lastMessageSender: "system",
                    unreadCountAdmin: 0,
                    unreadCountCustomer: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                await conversation.save();
            }
        }

        return res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error("Error in admin_get_or_create_conversation:", error);
        return res.status(500).json({ success: false, message: "Failed to locate or start conversation" });
    }
};

/**
 * HTTP fallback endpoint to send a message (or send with attachment).
 */
const send_message_http = async (req, res) => {
    try {
        const {
            conversationId,
            senderType, // "customer" | "admin" | "guest"
            senderId,
            senderName,
            message = "",
            messageType = "text",
            attachmentUrl = ""
        } = req.body;

        if (!conversationId || (!message && !attachmentUrl)) {
            return res.status(400).json({ success: false, message: "conversationId and message/attachment are required" });
        }

        const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newMessage = new ChatMessage({
            messageId,
            conversationId,
            senderType: senderType || (req.isAdmin ? "admin" : "customer"),
            senderId: senderId || (req.user?._id ? String(req.user._id) : ""),
            senderName: senderName || req.user?.fullname || (req.isAdmin ? "Gemora Atelier" : "Customer"),
            message: message.trim(),
            messageType,
            attachmentUrl,
            isRead: false,
            createdAt: new Date().toISOString()
        });

        await newMessage.save();

        // Schedule 5-minute unread email alert
        scheduleUnreadCheck({
            conversationId,
            senderType: newMessage.senderType
        });

        const isCustomerSide = newMessage.senderType === "customer" || newMessage.senderType === "guest";
        const displayMsg = messageType === "image" ? "📷 Image" : message;

        const updateFields = {
            lastMessage: displayMsg,
            lastMessageAt: new Date().toISOString(),
            lastMessageSender: newMessage.senderType,
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

        // Emit through Socket.IO if available
        const io = getIO();
        if (io) {
            const roomName = `conversation_${conversationId}`;
            io.to(roomName).emit("new_message", {
                message: newMessage,
                conversationId
            });

            if (isCustomerSide) {
                io.to("admin_support_channel").emit("notify_admin_inbox", {
                    conversationId,
                    lastMessage: displayMsg,
                    senderName: newMessage.senderName,
                    conversation: updatedConv
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: newMessage,
            conversation: updatedConv
        });
    } catch (error) {
        console.error("Error sending message via HTTP:", error);
        return res.status(500).json({ success: false, message: "Failed to send message" });
    }
};

/**
 * Upload chat attachment (image/document) to S3.
 */
const upload_attachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }

        const fileUrl = req.file.location || req.file.path || "";
        return res.status(200).json({
            success: true,
            url: fileUrl,
            filename: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error("Error uploading chat attachment:", error);
        return res.status(500).json({ success: false, message: "Attachment upload failed" });
    }
};

// ==========================================
// Admin Panel Chat Management Endpoints
// ==========================================

/**
 * List all conversations for Admin Support dashboard.
 */
const get_admin_conversations = async (req, res) => {
    try {
        const { search = "" } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = {};

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { customerName: regex },
                { customerEmail: regex },
                { conversationId: regex },
                { lastMessage: regex }
            ];
        }

        const [conversations, total] = await Promise.all([
            ChatConversation.find(filter)
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChatConversation.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            conversations,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching admin conversations:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch conversations" });
    }
};

/**
 * Toggle conversation status (kept for backwards compatibility).
 */
const update_conversation_status = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Status updated"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

/**
 * Get total unread count for Admin badge (header icon).
 */
const get_admin_unread_count = async (_req, res) => {
    try {
        const result = await ChatConversation.aggregate([
            { $group: { _id: null, totalUnread: { $sum: "$unreadCountAdmin" } } }
        ]);

        const totalUnread = result.length > 0 ? result[0].totalUnread : 0;
        return res.status(200).json({ success: true, totalUnread });
    } catch (error) {
        console.error("Error getting unread count:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch unread count" });
    }
};

module.exports = {
    initiate_conversation,
    get_messages,
    send_message_http,
    upload_attachment,
    get_admin_conversations,
    update_conversation_status,
    get_admin_unread_count,
    mark_admin_read,
    admin_get_or_create_conversation
};