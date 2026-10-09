const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    itemid: {
        type: Number,
        required: true
    },
    itemname: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    metalname: {
        type: String,
        default: ""
    },
    stonename: {
        type: String,
        default: ""
    },
    diamondsize: {
        type: String,
        default: ""
    },
    shapename: {
        type: String,
        default: ""
    },
    clarityname: {
        type: String,
        default: ""
    },
    diamondcolor: {
        type: String,
        default: ""
    },
    bandcolor: {
        type: String,
        default: ""
    },
    specialinstruction: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    qty: {
        type: Number,
        required: true,
        default: 1
    },
    totalprice: {
        type: Number,
        default: 0
    }
}, { _id: false });

const orderAddressSchema = new mongoose.Schema({
    addressid: {
        type: Number,
        default: null
    },
    title: {
        type: String,
        default: "Home"
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    countryname: {
        type: String,
        required: true,
        trim: true
    },
    countrycode: {
        type: String,
        default: ""
    },
    statename: {
        type: String,
        required: true,
        trim: true
    },
    statecode: {
        type: String,
        default: ""
    },
    cityname: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const orderCurrencySchema = new mongoose.Schema({
    currencyid: {
        type: Number,
        default: null
    },
    countryname: {
        type: String,
        default: ""
    },
    currency: {
        type: String,
        default: "INR"
    },
    currencysymbol: {
        type: String,
        default: "₹"
    },
    currencyposition: {
        type: String,
        default: "left"
    },
    thousandseparator: {
        type: String,
        default: ""
    },
    decimalseparator: {
        type: String,
        default: "."
    },
    decimal: {
        type: Number,
        default: 2
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderid: {
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
    customerid: {
        type: Number,
        required: true,
        index: true
    },
    customername: {
        type: String,
        default: ""
    },
    customeremail: {
        type: String,
        default: ""
    },
    customerphone: {
        type: String,
        default: ""
    },
    items: {
        type: [orderItemSchema],
        default: []
    },
    totalitems: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    currencydetails: {
        type: orderCurrencySchema,
        default: () => ({})
    },
    shippingaddress: {
        type: orderAddressSchema,
        required: true
    },
    orderstatus: {
        type: String,
        enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Confirmed"
    },
    paymentstatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Paid"
    },
    paymentmethod: {
        type: String,
        default: "Credit/Debit Card"
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

orderSchema.index({ fiscalyearid: 1, ordernumber: 1 }, { unique: true });

orderSchema.virtual('currency').get(function() {
    return this.currencydetails?.currency || "INR";
});
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = OrderModel;