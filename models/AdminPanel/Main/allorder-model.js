const mongoose = require("mongoose");

const allOrderItemSchema = new mongoose.Schema({
    itemid: {
        type: Number,
        default: null
    },
    itemname: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        default: "",
        trim: true
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
    ringsize: {
        type: String,
        default: ""
    },
    closuretype: {
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

const allOrderAddressSchema = new mongoose.Schema({
    address: {
        type: String,
        default: "",
        trim: true
    },
    pincode: {
        type: String,
        default: "",
        trim: true
    },
    countryname: {
        type: String,
        default: "",
        trim: true
    },
    countrycode: {
        type: String,
        default: ""
    },
    statename: {
        type: String,
        default: "",
        trim: true
    },
    statecode: {
        type: String,
        default: ""
    },
    cityname: {
        type: String,
        default: "",
        trim: true
    }
}, { _id: false });

const allOrderCurrencySchema = new mongoose.Schema({
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
        default: "USD"
    },
    currencysymbol: {
        type: String,
        default: "$"
    },
    currencyposition: {
        type: String,
        default: "left"
    },
    thousandseparator: {
        type: String,
        default: ","
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
    customerid: {
        type: Number,
        default: null,
        index: true
    },
    customername: {
        type: String,
        required: true,
        trim: true
    },
    customeremail: {
        type: String,
        default: "",
        trim: true
    },
    customerphone: {
        type: String,
        default: "",
        trim: true
    },
    items: {
        type: [allOrderItemSchema],
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
        type: allOrderCurrencySchema,
        default: () => ({})
    },
    shippingaddress: {
        type: allOrderAddressSchema,
        default: () => ({})
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
        default: "Cash"
    },
    notes: {
        type: String,
        default: "",
        trim: true
    },
    orderdate: {
        type: String,
        default: () => new Date().toISOString()
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