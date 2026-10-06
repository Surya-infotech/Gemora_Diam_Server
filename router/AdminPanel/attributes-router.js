const express = require("express");
const attributesRouter = express.Router();
const metalcontroller = require("../../controllers/AdminPanel/Attributes/metal-controller");
const diamondsizecontroller = require("../../controllers/AdminPanel/Attributes/diamondsize-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

// Metal Routes
attributesRouter.route("/GetMetals").get(authMiddleware, metalcontroller.get_metals);
attributesRouter.route("/GetActiveMetals").get(metalcontroller.get_active_metals);
attributesRouter.route("/AddMetal").post(authMiddleware, metalcontroller.add_metal);
attributesRouter.route("/EditMetal/:metalid").get(authMiddleware, metalcontroller.edit_metal);
attributesRouter.route("/UpdateMetalStatus/:metalid").put(authMiddleware, metalcontroller.update_metal_status);
attributesRouter.route("/UpdateMetal/:metalid").put(authMiddleware, metalcontroller.update_metal);
attributesRouter.route("/DeleteMetal/:metalid").delete(authMiddleware, metalcontroller.delete_metal);


// Diamond Size Routes
attributesRouter.route("/GetDiamondSizes").get(authMiddleware, diamondsizecontroller.get_diamond_sizes);
attributesRouter.route("/GetActiveDiamondSizes").get(diamondsizecontroller.get_active_diamond_sizes);
attributesRouter.route("/AddDiamondSize").post(authMiddleware, diamondsizecontroller.add_diamond_size);
attributesRouter.route("/EditDiamondSize/:diamondsizeid").get(authMiddleware, diamondsizecontroller.edit_diamond_size);
attributesRouter.route("/UpdateDiamondSizeStatus/:diamondsizeid").put(authMiddleware, diamondsizecontroller.update_diamond_size_status);
attributesRouter.route("/UpdateDiamondSize/:diamondsizeid").put(authMiddleware, diamondsizecontroller.update_diamond_size);
attributesRouter.route("/DeleteDiamondSize/:diamondsizeid").delete(authMiddleware, diamondsizecontroller.delete_diamond_size);

module.exports = attributesRouter;
