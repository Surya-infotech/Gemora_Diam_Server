const express = require("express");
const customerRouter = express.Router();
const customerController = require("../controllers/customer-controller");
const { customerOrAdminAuth } = require("../middlewares/auth-middleware");

customerRouter.post("/Signup", customerController.signup);
customerRouter.post("/Signin", customerController.signin);
customerRouter.get("/verify-token", customerController.verifyToken);

// Customer details routes (callable by User with x-user header or Admin without x-user header)
customerRouter.put("/UpdateProfile/:customerId", customerOrAdminAuth, customerController.update_profile);

// Address Details routes
customerRouter.get("/GetAddresses/:customerId", customerOrAdminAuth, customerController.get_addresses);
customerRouter.post("/AddAddress", customerOrAdminAuth, customerController.add_address);
customerRouter.put("/UpdateAddress/:addressId", customerOrAdminAuth, customerController.update_address);
customerRouter.delete("/DeleteAddress/:addressId", customerOrAdminAuth, customerController.delete_address);
customerRouter.put("/SetDefaultAddress/:addressId", customerOrAdminAuth, customerController.set_default_address);


// Order routes
customerRouter.post("/CreateOrder", customerOrAdminAuth, customerController.create_order);
customerRouter.get("/GetOrders/:customerId", customerOrAdminAuth, customerController.get_customer_orders);
// Order list & management for Admin Panel and User
customerRouter.get("/GetOrdersByFiscalYear/:fiscalYearId", customerOrAdminAuth, customerController.get_orders_by_fiscal_year);
customerRouter.get("/GetAllOrders", customerOrAdminAuth, customerController.get_orders_by_fiscal_year);
customerRouter.put("/UpdateOrderStatus/:orderId", customerOrAdminAuth, customerController.update_order_status);
customerRouter.delete("/DeleteOrder/:orderId", customerOrAdminAuth, customerController.delete_order);

module.exports = customerRouter;