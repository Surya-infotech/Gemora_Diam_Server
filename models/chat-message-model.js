const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    senderType: {
        type: String,
        enum: ["customer", "admin", "guest", "system"],
        required: true
    },
    senderId: {
        type: String,
        default: ""
    },
    senderName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ""
    },
    messageType: {
        type: String,
        enum: ["text", "image", "product_link"],
        default: "text"
    },
    attachmentUrl: {
        type: String,
        default: ""
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: String,
        default: null
    },
    emailNotificationSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString(),
        index: true
    }
});

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

const ChatMessage = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;
