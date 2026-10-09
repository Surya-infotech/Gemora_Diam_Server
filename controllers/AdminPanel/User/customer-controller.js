const mongoose = require("mongoose");
const Customer = require("../../../models/customer-model");
const CustomerAddress = require("../../../models/customer-address-model");

const get_customers = async (_req, res) => {
    try {
        const customers = await Customer.find()
            .select("-password -Token")
            .sort({ createdAt: -1 })
            .lean();

        const customersWithAddresses = await Promise.all(
            customers.map(async (cust) => {
                const numericId = cust.customerid;
                let defaultAddress = null;
                let addressCount = 0;
                if (numericId != null) {
                    const addresses = await CustomerAddress.find({ customerid: numericId }).lean();
                    addressCount = addresses.length;
                    defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;
                }
                return {
                    ...cust,
                    addressCount,
                    defaultAddress: defaultAddress ? {
                        city: defaultAddress.cityname || "",
                        state: defaultAddress.statename || "",
                        country: defaultAddress.countryname || "",
                        address: defaultAddress.address || ""
                    } : null
                };
            })
        );

        return res.status(200).json({ customers: customersWithAddresses });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_customer_status = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { status } = req.body;

        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        let customer = null;
        if (mongoose.Types.ObjectId.isValid(customerId)) {
            customer = await Customer.findById(customerId);
        }
        if (!customer && !isNaN(customerId)) {
            customer = await Customer.findOne({ customerid: Number(customerId) });
        }

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        customer.status = Boolean(status);
        customer.updatedAt = new Date().toISOString();
        await customer.save();

        const customerData = customer.toObject();
        delete customerData.password;
        delete customerData.Token;

        return res.status(200).json({
            message: "Customer status updated successfully",
            customer: customerData
        });
    } catch (error) {
        console.error("Error updating customer status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_customers,
    update_customer_status
};