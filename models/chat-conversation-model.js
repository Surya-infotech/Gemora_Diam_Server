const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
    customerId: {
        type: Number,
        default: null,
        index: true
    },
    guestId: {
        type: String,
        default: null,
        index: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    customerPhone: {
        type: String,
        default: ""
    },
    lastMessage: {
        type: String,
        default: ""
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastMessageSender: {
        type: String,
        enum: ["customer", "admin", "guest", "system"],
        default: "customer"
    },
    unreadCountAdmin: {
        type: Number,
        default: 0
    },
    unreadCountCustomer: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["open", "closed"],
        default: "open",
        index: true
    },
    assignedAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null
    },
    assignedAdminName: {
        type: String,
        default: ""
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

chatConversationSchema.index({ customerId: 1, status: 1 });
chatConversationSchema.index({ guestId: 1, status: 1 });

const ChatConversation = mongoose.models.ChatConversation || mongoose.model("ChatConversation", chatConversationSchema);

module.exports = ChatConversation;
