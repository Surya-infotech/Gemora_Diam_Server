const express = require("express");
const productsrouter = express.Router();
const itemcontroller = require("../../controllers/AdminPanel/Products/item-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");
const { multiuploadToS3, uploadVideoToS3, multiuploadVideoToS3 } = require("../../utils/s3Config-admin");

productsrouter.route("/GetItems").get(authMiddleware, itemcontroller.get_items);
productsrouter.route("/GetActiveItems").get(itemcontroller.get_active_items);
productsrouter.route("/AddItem").post(authMiddleware, itemcontroller.add_item);
productsrouter.route("/EditItem/:itemid").get(authMiddleware, itemcontroller.edit_item);
productsrouter.route("/GetItemDetails/:itemid").get(authMiddleware, itemcontroller.edit_item);
productsrouter.route("/UpdateItem/:itemid").put(authMiddleware, itemcontroller.update_item);
productsrouter.route("/DeleteItem/:itemid").delete(authMiddleware, itemcontroller.delete_item);
productsrouter.route("/UpdateItemPrice/:itemid").put(authMiddleware, itemcontroller.update_item_price);
productsrouter.route("/UpdateItemStatus/:itemid").put(authMiddleware, itemcontroller.update_item_status);

// Item Gallery routes
productsrouter.route("/GetItemGalleryImages/:itemid").get(authMiddleware, itemcontroller.get_item_gallery_images);
productsrouter.route("/UploadItemGalleryImages/:itemid").post(authMiddleware, multiuploadToS3("item-gallery"), itemcontroller.upload_item_gallery_images);
productsrouter.route("/DeleteItemGalleryImage/:itemid/:imageId").delete(authMiddleware, itemcontroller.delete_item_gallery_image);

// Item Video routes
productsrouter.route("/UploadItemVideo/:itemid").post(authMiddleware, uploadVideoToS3("item-video"), itemcontroller.upload_item_video);
productsrouter.route("/UploadItemVideos/:itemid").post(authMiddleware, multiuploadVideoToS3("item-video"), itemcontroller.upload_item_videos);
productsrouter.route("/DeleteItemVideo/:itemid/:videoId").delete(authMiddleware, itemcontroller.delete_item_video);
productsrouter.route("/DeleteItemVideo/:itemid").delete(authMiddleware, itemcontroller.delete_item_video);

module.exports = productsrouter;