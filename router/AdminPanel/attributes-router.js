const express = require("express");
const attributesRouter = express.Router();
const metalcontroller = require("../../controllers/AdminPanel/Attributes/metal-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

// Metal Routes
attributesRouter.route("/GetMetals").get(authMiddleware, metalcontroller.get_metals);
attributesRouter.route("/GetActiveMetals").get(metalcontroller.get_active_metals);
attributesRouter.route("/AddMetal").post(authMiddleware, metalcontroller.add_metal);
attributesRouter.route("/EditMetal/:metalid").get(authMiddleware, metalcontroller.edit_metal);
attributesRouter.route("/UpdateMetalStatus/:metalid").put(authMiddleware, metalcontroller.update_metal_status);
attributesRouter.route("/UpdateMetal/:metalid").put(authMiddleware, metalcontroller.update_metal);
attributesRouter.route("/DeleteMetal/:metalid").delete(authMiddleware, metalcontroller.delete_metal);

module.exports = attributesRouter;
