const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    type: { type: String, default: "" },
    addedAt: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

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
    country: {
        type: String,
        default: "",
        trim: true
    },
    jewelryType: {
        type: String,
        default: "",
        trim: true
    },
    product: {
        type: String,
        default: "",
        trim: true
    },
    metal: {
        type: String,
        default: "",
        trim: true
    },
    ringSize: {
        type: String,
        default: "",
        trim: true
    },
    stoneType: {
        type: String,
        default: "",
        trim: true
    },
    stoneShape: {
        type: String,
        default: "",
        trim: true
    },
    centerCarat: {
        type: String,
        default: "",
        trim: true
    },
    sideStoneType: {
        type: String,
        default: "",
        trim: true
    },
    measurements: {
        type: String,
        default: "",
        trim: true
    },
    employee: {
        type: String,
        default: "",
        trim: true
    },
    stone: {
        type: String,
        default: "",
        trim: true
    },
    status: {
        type: String,
        default: "Order Received",
        trim: true
    },
    targetDate: {
        type: String,
        default: ""
    },
    priority: {
        type: String,
        default: "Normal",
        trim: true
    },
    productionNotes: {
        type: String,
        default: ""
    },
    conversation: {
        type: String,
        default: ""
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    photoFile: {
        type: attachmentSchema,
        default: null
    },
    cadFile: {
        type: attachmentSchema,
        default: null
    },
    otherFile: {
        type: attachmentSchema,
        default: null
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
    deliveryDate: {
        type: String,
        default: ""
    },
    dispatchNotes: {
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

allOrderSchema.index({ fiscalyearid: 1, ordernumber: 1 }, { unique: true });

const AllOrderModel = mongoose.models.AllOrder || mongoose.model("AllOrder", allOrderSchema);

module.exports = AllOrderModel;