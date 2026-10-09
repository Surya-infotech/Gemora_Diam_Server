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

module.exports = customerRouter;