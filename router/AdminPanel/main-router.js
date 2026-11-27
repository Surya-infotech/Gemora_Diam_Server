const express = require("express");
const mainrouter = express.Router();
const maincontroller = require("../../controllers/AdminPanel/main-controller");
const allordercontroller = require("../../controllers/AdminPanel/Main/allorder-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

mainrouter.route("/GetDashboard").get(authMiddleware, maincontroller.get_dashboard);
mainrouter.route("/GetDashboard/:fiscalYearId").get(authMiddleware, maincontroller.get_dashboard);

// All Order Routes
mainrouter.route("/GetAllOrders").get(authMiddleware, allordercontroller.get_all_orders);
mainrouter.route("/GetAllOrders/:fiscalYearId").get(authMiddleware, allordercontroller.get_all_orders);
mainrouter.route("/AddAllOrder").post(authMiddleware, allordercontroller.add_all_order);
mainrouter.route("/GetAllOrderDetails/:id").get(authMiddleware, allordercontroller.get_all_order_details);
mainrouter.route("/EditAllOrder/:id").get(authMiddleware, allordercontroller.get_all_order_details);
mainrouter.route("/UpdateAllOrder/:id").put(authMiddleware, allordercontroller.update_all_order);
mainrouter.route("/DeleteAllOrder/:id").delete(authMiddleware, allordercontroller.delete_all_order);

module.exports = mainrouter;