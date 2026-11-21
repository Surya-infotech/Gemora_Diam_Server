const express = require("express");
const chatRouter = express.Router();
const chatController = require("../controllers/chat-controller");
const { authMiddleware, customerOrAdminAuth } = require("../middlewares/auth-middleware");
const { uploadToS3 } = require("../utils/s3Config-admin");

/**
 * Optional Authentication middleware:
 * If an Authorization header is provided, verifies it.
 * If not provided, allows guest visitors to proceed without error.
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.header("Authorization") || req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    return customerOrAdminAuth(req, res, next);
};

// ==========================================
// Customer / Visitor Chat Routes
// ==========================================
// Initiate or resume conversation (supports logged-in customer or guest visitor)
chatRouter.post("/Initiate", optionalAuth, chatController.initiate_conversation);

// Get message history for a conversation
chatRouter.get("/Messages/:conversationId", optionalAuth, chatController.get_messages);

// HTTP send message fallback
chatRouter.post("/SendMessage", optionalAuth, chatController.send_message_http);

// Upload image/attachment for chat (saved directly to S3)
chatRouter.post("/UploadAttachment", uploadToS3("chat"), chatController.upload_attachment);

// ==========================================
// Admin Panel Chat Management Routes
// ==========================================
// List all conversations (filters: status=open/closed/all, search)
chatRouter.get("/Admin/Conversations", authMiddleware, chatController.get_admin_conversations);

// Admin view messages for a conversation
chatRouter.get("/Admin/Messages/:conversationId", authMiddleware, chatController.get_messages);

// Toggle conversation status (open / closed)
chatRouter.put("/Admin/ConversationStatus/:conversationId", authMiddleware, chatController.update_conversation_status);

// Global unread badge count for Admin navigation bar
chatRouter.get("/Admin/UnreadCount", authMiddleware, chatController.get_admin_unread_count);

module.exports = chatRouter;
