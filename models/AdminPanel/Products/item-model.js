const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemid: { type: Number, required: true },
    sku: { type: String, default: "" },
    itemname: { type: String, required: true },
    categoryid: { type: Number, default: null },
    categoryname: { type: String, default: "" },
    subcategoryid: { type: Number, default: null },
    subcategoryname: { type: String, default: "" },
    ringsizes: {
        type: [
            {
                ringsizeid: { type: Number },
                ringsize: { type: String }
            }
        ],
        default: []
    },
    shapes: {
        type: [
            {
                shapeid: { type: Number },
                shapename: { type: String }
            }
        ],
        default: []
    },
    clarities: {
        type: [
            {
                clarityid: { type: Number },
                clarityname: { type: String }
            }
        ],
        default: []
    },
    diamondcolors: {
        type: [
            {
                colorid: { type: Number },
                colorname: { type: String }
            }
        ],
        default: []
    },
    bandcolors: {
        type: [
            {
                colorid: { type: Number },
                colorname: { type: String }
            }
        ],
        default: []
    },
    stones: {
        type: [
            {
                stoneid: { type: Number },
                stonename: { type: String }
            }
        ],
        default: []
    },
    styles: {
        type: [
            {
                styleid: { type: Number },
                stylename: { type: String }
            }
        ],
        default: []
    },
    pricing: {
        priceType: {
            type: String,
            enum: ['metal_wise', 'metal_with_diamond_carat', 'metal_with_stone', 'metal_with_stone_diamond_carat'],
            default: 'metal_wise'
        },
        metalWisePrices: {
            type: [
                {
                    metalid: { type: Number },
                    metalname: { type: String, default: "" },
                    metaltype: { type: String, default: "" },
                    price: { type: Number, default: 0 }
                }
            ],
            default: []
        },
        metalWithDiamondCaratPrices: {
            type: [
                {
                    metalid: { type: Number },
                    metalname: { type: String, default: "" },
                    metaltype: { type: String, default: "" },
                    caratPrices: [
                        {
                            diamondsizeid: { type: Number },
                            diamondsize: { type: String, default: "" },
                            price: { type: Number, default: 0 }
                        }
                    ]
                }
            ],
            default: []
        },
        metalWithStonePrices: {
            type: [
                {
                    metalid: { type: Number },
                    metalname: { type: String, default: "" },
                    metaltype: { type: String, default: "" },
                    stonePrices: [
                        {
                            stoneid: { type: Number },
                            stonename: { type: String, default: "" },
                            price: { type: Number, default: 0 }
                        }
                    ]
                }
            ],
            default: []
        },
        metalWithStoneDiamondCaratPrices: {
            type: [
                {
                    metalid: { type: Number },
                    metalname: { type: String, default: "" },
                    metaltype: { type: String, default: "" },
                    stoneid: { type: Number },
                    stonename: { type: String, default: "" },
                    caratPrices: [
                        {
                            diamondsizeid: { type: Number },
                            diamondsize: { type: String, default: "" },
                            price: { type: Number, default: 0 }
                        }
                    ]
                }
            ],
            default: []
        }
    },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    galleryimages: [
        {
            imageUrl: { type: String, default: "" },
            createdAt: { type: String }
        }
    ],
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

module.exports = ItemModel;