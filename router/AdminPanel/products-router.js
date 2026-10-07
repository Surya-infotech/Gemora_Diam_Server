const express = require("express");
const productsrouter = express.Router();
const itemcontroller = require("../../controllers/AdminPanel/Products/item-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

productsrouter.route("/GetItems").get(authMiddleware, itemcontroller.get_items);
productsrouter.route("/GetActiveItems").get(itemcontroller.get_active_items);
productsrouter.route("/AddItem").post(authMiddleware, itemcontroller.add_item);
productsrouter.route("/EditItem/:itemid").get(authMiddleware, itemcontroller.edit_item);
productsrouter.route("/GetItemDetails/:itemid").get(authMiddleware, itemcontroller.edit_item);
productsrouter.route("/UpdateItem/:itemid").put(authMiddleware, itemcontroller.update_item);
productsrouter.route("/DeleteItem/:itemid").delete(authMiddleware, itemcontroller.delete_item);
productsrouter.route("/UpdateItemPrice/:itemid").put(authMiddleware, itemcontroller.update_item_price);
productsrouter.route("/UpdateItemStatus/:itemid").put(authMiddleware, itemcontroller.update_item_status);

module.exports = productsrouter;
