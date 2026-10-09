const express = require("express");
const userrouter = express.Router();
const employeecontroller = require("../../controllers/AdminPanel/User/employee-controller");
const customercontroller = require("../../controllers/AdminPanel/User/customer-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

// Employee Routes
userrouter.route("/GetEmployees").get(authMiddleware, employeecontroller.get_employees);
userrouter.route("/AddEmployee").post(authMiddleware, employeecontroller.add_employee);
userrouter.route("/EditEmployee/:employeeId").get(authMiddleware, employeecontroller.edit_employee);
userrouter.route("/GetEmployeeDetails/:employeeId").get(authMiddleware, employeecontroller.edit_employee);
userrouter.route("/UpdateEmployee/:employeeId").put(authMiddleware, employeecontroller.update_employee);
userrouter.route("/UpdateEmployeeStatus/:employeeId").put(authMiddleware, employeecontroller.update_employee_status);
userrouter.route("/DeleteEmployee/:employeeId").delete(authMiddleware, employeecontroller.delete_employee);

userrouter.route("/GetEmployeePermissions/:employeeId").get(authMiddleware, employeecontroller.get_employee_permissions);
userrouter.route("/UpdateEmployeePermissions/:employeeId").put(authMiddleware, employeecontroller.update_employee_permissions);

// Customer Routes
userrouter.route("/GetCustomers").get(authMiddleware, customercontroller.get_customers);
userrouter.route("/UpdateCustomerStatus/:customerId").put(authMiddleware, customercontroller.update_customer_status);

module.exports = userrouter;