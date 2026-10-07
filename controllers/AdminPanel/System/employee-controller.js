const Employee = require("../../../models/AdminPanel/System/employee-model");
const Admin = require("../../../models/admin-model");
const bcrypt = require("bcryptjs");

const get_employees = async (req, res) => {
    try {
        const employees = await Employee.find().select("-password").sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ employees: employees || [] });
    } catch (error) {
        console.error("Error fetching employees:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_employee = async (req, res) => {
    try {
        const { firstname, lastname, email, password, phone, employeetype } = req.body;

        if (!firstname || !lastname || !email || !password || !employeetype) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const cleanEmail = email.toLowerCase().trim();

        const existingEmployee = await Employee.findOne({ email: cleanEmail });
        if (existingEmployee) {
            return res.status(400).json({ message: "Email Already Exists" });
        }

        const existingAdmin = await Admin.findOne({ email: cleanEmail });
        if (existingAdmin) {
            return res.status(400).json({ message: "Email Already Exists" });
        }

        const maxEmp = await Employee.findOne().sort({ employeeid: -1 });
        const nextEmployeeId = maxEmp ? parseInt(maxEmp.employeeid) + 1 : 1;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newEmployee = new Employee({
            employeeid: nextEmployeeId,
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            email: cleanEmail,
            password: hashedPassword,
            phone: phone ? phone.trim() : "",
            employeetype: employeetype || "Employee",
            status: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await newEmployee.save();

        const savedEmployee = newEmployee.toObject();
        delete savedEmployee.password;

        return res.status(201).json({ message: "Employee added successfully", employee: savedEmployee });
    } catch (error) {
        console.error("Error adding employee:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_employee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "Employee ID is required" });

        let employee = await Employee.findOne({ _id: employeeId }).select("-password");
        if (!employee) {
            employee = await Employee.findOne({ employeeid: employeeId }).select("-password");
        }

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        return res.status(200).json(employee);
    } catch (error) {
        console.error("Error fetching employee details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_employee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { firstname, lastname, email, phone, employeetype, status } = req.body;

        if (!employeeId) return res.status(400).json({ message: "Employee ID is required" });
        if (!firstname || !lastname || !email || !employeetype) {
            return res.status(400).json({ message: "All fields are required" });
        }

        let employee = await Employee.findOne({ _id: employeeId });
        if (!employee) {
            employee = await Employee.findOne({ employeeid: employeeId });
        }

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const cleanEmail = email.toLowerCase().trim();

        const emailExists = await Employee.findOne({
            email: cleanEmail,
            _id: { $ne: employee._id }
        });
        if (emailExists) {
            return res.status(400).json({ message: "Email Already Exists" });
        }

        const adminEmailExists = await Admin.findOne({ email: cleanEmail });
        if (adminEmailExists) {
            return res.status(400).json({ message: "Email Already Exists" });
        }

        employee.firstname = firstname.trim();
        employee.lastname = lastname.trim();
        employee.email = cleanEmail;
        employee.phone = phone ? phone.trim() : "";
        employee.employeetype = employeetype;
        if (status !== undefined) {
            employee.status = Boolean(status);
        }
        employee.updatedAt = new Date().toISOString();

        await employee.save();

        return res.status(200).json({ message: "Employee updated successfully" });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_employee_status = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { status } = req.body;

        if (!employeeId) return res.status(400).json({ message: "Employee ID is required" });

        let employee = await Employee.findOne({ _id: employeeId });
        if (!employee) {
            employee = await Employee.findOne({ employeeid: employeeId });
        }

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        employee.status = status;
        employee.updatedAt = new Date().toISOString();
        await employee.save();

        return res.status(200).json({
            message: "Employee status updated to " + (status ? "Active" : "Inactive")
        });
    } catch (error) {
        console.error("Error updating employee status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_employee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) return res.status(400).json({ message: "Employee ID is required" });

        let employee = await Employee.findOne({ _id: employeeId });
        if (!employee) {
            employee = await Employee.findOne({ employeeid: employeeId });
        }

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        await Employee.deleteOne({ _id: employee._id });

        return res.status(200).json({ message: "Employee Deleted Successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_employees,
    add_employee,
    edit_employee,
    update_employee,
    update_employee_status,
    delete_employee
};