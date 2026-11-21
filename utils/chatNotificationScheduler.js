const ChatMessage = require("../models/chat-message-model");
const ChatConversation = require("../models/chat-conversation-model");
const {
    sendUnreadChatEmailToAdmin,
    sendUnreadChatEmailToCustomer
} = require("./emailService");

// Map to track active debounce/timeout timers: key is `${conversationId}_${target}`
const pendingTimers = new Map();

// 5 minutes in milliseconds (configurable via CHAT_UNREAD_EMAIL_DELAY_MS env variable)
const DEFAULT_DELAY_MS = 5 * 60 * 1000;

const getDelayMs = () => {
    const envVal = Number(process.env.CHAT_UNREAD_EMAIL_DELAY_MS);
    return !isNaN(envVal) && envVal > 0 ? envVal : DEFAULT_DELAY_MS;
};

/**
 * Schedules an unread check after 5 minutes for the recipient.
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.senderType - "customer" | "guest" | "admin"
 */
const scheduleUnreadCheck = ({ conversationId, senderType }) => {
    if (!conversationId) return;

    const isCustomerSender = senderType === "customer" || senderType === "guest";
    const targetRecipient = isCustomerSender ? "admin" : "customer";
    const timerKey = `${conversationId}_${targetRecipient}`;

    // If a timer is already counting down for this conversation & recipient,
    // let it continue so the alert fires 5 minutes after the first unread message
    if (pendingTimers.has(timerKey)) {
        return;
    }

    const delay = getDelayMs();

    const timer = setTimeout(async () => {
        pendingTimers.delete(timerKey);

        try {
            // Check if there are still unread messages for this recipient that haven't triggered an email
            const senderFilter = isCustomerSender
                ? { $in: ["customer", "guest"] }
                : "admin";

            const unreadMessages = await ChatMessage.find({
                conversationId,
                senderType: senderFilter,
                isRead: false,
                emailNotificationSent: { $ne: true }
            }).sort({ createdAt: 1 });

            if (!unreadMessages || unreadMessages.length === 0) {
                // All messages were read by the recipient within the 5 minutes
                return;
            }

            const conversation = await ChatConversation.findOne({ conversationId });
            if (!conversation) return;

            if (targetRecipient === "admin") {
                // Check if admin unread count is still > 0
                if ((conversation.unreadCountAdmin || 0) > 0) {
                    await sendUnreadChatEmailToAdmin({
                        conversation,
                        unreadMessages,
                        unreadCount: unreadMessages.length
                    });

                    // Mark messages so we don't send duplicate emails for the same batch
                    const msgIds = unreadMessages.map(m => m.messageId);
                    await ChatMessage.updateMany(
                        { messageId: { $in: msgIds } },
                        { $set: { emailNotificationSent: true } }
                    );
                }
            } else {
                // Sent to customer if unreadCountCustomer > 0
                if ((conversation.unreadCountCustomer || 0) > 0) {
                    await sendUnreadChatEmailToCustomer({
                        conversation,
                        unreadMessages,
                        unreadCount: unreadMessages.length
                    });

                    const msgIds = unreadMessages.map(m => m.messageId);
                    await ChatMessage.updateMany(
                        { messageId: { $in: msgIds } },
                        { $set: { emailNotificationSent: true } }
                    );
                }
            }
        } catch (err) {
            // Silent error handling
        }
    }, delay);

    pendingTimers.set(timerKey, timer);
};

/**
 * Cancels pending unread check when recipient reads the messages.
 * @param {string} conversationId
 * @param {string} readerType - "admin" | "customer"
 */
const cancelUnreadCheck = (conversationId, readerType) => {
    if (!conversationId || !readerType) return;
    const timerKey = `${conversationId}_${readerType}`;

    if (pendingTimers.has(timerKey)) {
        clearTimeout(pendingTimers.get(timerKey));
        pendingTimers.delete(timerKey);
    }
};

module.exports = {
    scheduleUnreadCheck,
    cancelUnreadCheck
};
