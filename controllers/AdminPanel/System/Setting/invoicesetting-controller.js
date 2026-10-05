const InvoiceSetting = require("../../../../models/AdminPanel/System/Setting/invoicesetting-model");

const get_invoice_setting = async (req, res) => {
    try {
        const InvoiceSettingModel = InvoiceSetting(req.db);
        let invoiceSetting = await InvoiceSettingModel.findOne();

        if (!invoiceSetting) {
            invoiceSetting = await InvoiceSettingModel.create({
                invoiceprefix: "GD-INV-",
                notes: "Thank you for doing business with Gemora Diam. All certified diamonds are verified with standard industry grading reports."
            });
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
        const InvoiceSettingModel = InvoiceSetting(req.db);

        let invoiceSetting = await InvoiceSettingModel.findOne();

        if (invoiceSetting) {
            const updateData = {};
            if (invoiceprefix !== undefined) updateData.invoiceprefix = invoiceprefix;
            if (notes !== undefined) updateData.notes = notes;

            invoiceSetting = await InvoiceSettingModel.findOneAndUpdate(
                { _id: invoiceSetting._id },
                updateData,
                { new: true }
            );
        } else {
            invoiceSetting = new InvoiceSettingModel({ invoiceprefix, notes });
            await invoiceSetting.save();
        }

        return res.status(200).json(invoiceSetting);
    } catch (error) {
        console.log("Error updating invoice setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_invoice_setting, update_invoice_setting };
