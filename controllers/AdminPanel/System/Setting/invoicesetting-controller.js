const InvoiceSetting = require("../../../../models/AdminPanel/System/Setting/invoicesetting-model");

const get_invoice_setting = async (req, res) => {
    try {
        const invoiceSetting = await InvoiceSetting.findOne();

        if (!invoiceSetting) {
            return res.status(404).json({ message: "Invoice setting not found" });
        }
        
        return res.status(200).json(invoiceSetting);
    } catch (error) {
        console.log("Error retrieving invoice setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_invoice_setting = async (req, res) => {
    try {
        const { invoiceprefix, notes } = req.body;

        let invoiceSetting = await InvoiceSetting.findOne();

        if (invoiceSetting) {
            const updateData = {};
            if (invoiceprefix !== undefined) updateData.invoiceprefix = invoiceprefix;
            if (notes !== undefined) updateData.notes = notes;

            invoiceSetting = await InvoiceSetting.findOneAndUpdate(
                { _id: invoiceSetting._id },
                updateData,
                { new: true }
            );
        } else {
            if (!invoiceprefix || !notes) {
                return res.status(400).json({ message: "All fields are required" });
            }

            invoiceSetting = new InvoiceSetting({
                invoiceprefix,
                notes
            });

            await invoiceSetting.save();
        }

        if (!invoiceSetting) {
            return res.status(404).json({ message: "Invoice setting not found" });
        }

        return res.status(200).json(invoiceSetting);
    } catch (error) {
        console.log("Error updating invoice setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_invoice_setting, update_invoice_setting };
