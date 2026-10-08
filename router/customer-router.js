const express = require("express");
const customerRouter = express.Router();
const customerController = require("../controllers/customer-controller");

customerRouter.post("/Signup", customerController.signup);
customerRouter.post("/Signin", customerController.signin);
customerRouter.get("/verify-token", customerController.verifyToken);
customerRouter.put("/UpdateProfile/:customerId", customerController.update_profile);

module.exports = customerRouter;