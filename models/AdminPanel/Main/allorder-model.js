const mongoose = require("mongoose");

const allOrderSchema = new mongoose.Schema({
    allorderid: {
        type: Number,
        required: true,
        unique: true
    },
    fiscalyearid: {
        type: Number,
        required: true,
        index: true
    },
    ordernumber: {
        type: Number,
        required: true
    },
    orderId: {
        type: String,
        required: true,
        trim: true
    },
    customer: {
        type: String,
        required: true,
        trim: true
    },
    orderDate: {
        type: String,
        default: ""
    },
    orderLink: {
        type: String,
        default: "",
        trim: true
    },
    shopName: {
        type: String,
        default: "",
        trim: true
    },
    metal: {
        type: String,
        default: "",
        trim: true
    },
    employee: {
        type: String,
        default: "",
        trim: true
    },
    status: {
        type: String,
        default: "Order Received",
        trim: true
    },
    conversation: {
        type: String,
        default: ""
    },
    dispatchDate: {
        type: String,
        default: ""
    },
    courier: {
        type: String,
        default: "",
        trim: true
    },
    tracking: {
        type: String,
        default: "",
        trim: true
    },
    trackingLink: {
        type: String,
        default: "",
        trim: true
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

allOrderSchema.index({ fiscalyearid: 1, ordernumber: 1 }, { unique: true });

const AllOrderModel = mongoose.models.AllOrder || mongoose.model("AllOrder", allOrderSchema);

module.exports = AllOrderModel;