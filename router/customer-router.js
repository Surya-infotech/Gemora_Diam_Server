const express = require("express");
const customerRouter = express.Router();
const customerController = require("../controllers/customer-controller");

customerRouter.post("/Signup", customerController.signup);
customerRouter.post("/Signin", customerController.signin);
customerRouter.get("/verify-token", customerController.verifyToken);
customerRouter.put("/UpdateProfile/:customerId", customerController.update_profile);

// Address Details routes
customerRouter.get("/GetAddresses/:customerId", customerController.get_addresses);
customerRouter.post("/AddAddress", customerController.add_address);
customerRouter.put("/UpdateAddress/:addressId", customerController.update_address);
customerRouter.delete("/DeleteAddress/:addressId", customerController.delete_address);
customerRouter.put("/SetDefaultAddress/:addressId", customerController.set_default_address);

module.exports = customerRouter;