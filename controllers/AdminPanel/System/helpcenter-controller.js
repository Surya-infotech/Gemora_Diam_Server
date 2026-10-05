const HelpCenter = require("../../../models/AdminPanel/System/helpcenter-model");
const MiscSetting = require("../../../models/AdminPanel/System/Setting/miscsetting-model");
const moment = require("moment-timezone");

const getAdminDateTimeFormat = (miscSetting) => {
    const dateFormat = miscSetting?.dateFormat || "DD/MM/YYYY";
    const timeFormat = miscSetting?.timeFormat || "hh:mm A";
    return `${dateFormat} ${timeFormat}`;
};

const formatHelpCenterDate = (dateValue, dateTimeFormat, timezone) => {
    if (!dateValue) return "";
    return moment(dateValue).tz(timezone || "UTC").format(dateTimeFormat);
};

const formatHelpCenterRecord = (record, dateTimeFormat, timezone) => ({
    ...record,
    createdAt: formatHelpCenterDate(record.createdAt, dateTimeFormat, timezone),
    updatedAt: formatHelpCenterDate(record.updatedAt, dateTimeFormat, timezone),
    messsages: (record.messsages || []).map((msg) => ({
        ...msg,
        createdAt: formatHelpCenterDate(msg.createdAt, dateTimeFormat, timezone),
    })),
});

const get_helpcenter = async (req, res) => {
    try {
        const miscSetting = await MiscSetting.findOne();
        const adminTimezone = miscSetting ? miscSetting.timeZone : "UTC";
        const adminDateTimeFormat = getAdminDateTimeFormat(miscSetting);

        const helpCenterList = await HelpCenter.find().sort({ updatedAt: -1 }).lean();
        const formattedHelpCenterList = helpCenterList.map((record) =>
            formatHelpCenterRecord(record, adminDateTimeFormat, adminTimezone),
        );

        return res.status(200).json(formattedHelpCenterList);
    } catch (error) {
        console.log("Error fetching Help Center:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_owner_helpcenter = async (req, res) => {
    try {
        const { ownerId } = req.params;
        if (!ownerId) return res.status(400).json({ message: "ownerId is required" });

        const miscSetting = await MiscSetting.findOne();
        const adminTimezone = miscSetting ? miscSetting.timeZone : "UTC";
        const adminDateTimeFormat = getAdminDateTimeFormat(miscSetting);

        const tickets = await HelpCenter.find({ ownerid: ownerId }).sort({ updatedAt: -1 }).lean();
        const formatted = tickets.map((t) => formatHelpCenterRecord(t, adminDateTimeFormat, adminTimezone));

        return res.status(200).json(formatted);
    } catch (error) {
        console.log("Error fetching owner help center:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_helpcenter_by_id = async (req, res) => {
    try {
        const { helpCenterId } = req.params;
        if (!helpCenterId) return res.status(400).json({ message: "helpCenterId is required" });

        let helpCenter = await HelpCenter.findOne({ _id: helpCenterId }).lean();
        if (!helpCenter) helpCenter = await HelpCenter.findOne({ ticketid: helpCenterId }).lean();

        if (!helpCenter) return res.status(404).json({ message: "Help center ticket not found" });

        const miscSetting = await MiscSetting.findOne();
        const adminTimezone = miscSetting ? miscSetting.timeZone : "UTC";
        const adminDateTimeFormat = getAdminDateTimeFormat(miscSetting);

        return res.status(200).json({
            message: "Help center details fetched successfully",
            helpCenter: formatHelpCenterRecord(helpCenter, adminDateTimeFormat, adminTimezone),
        });
    } catch (error) {
        console.log("Error fetching help center by id:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const resolve_helpcenter = async (req, res) => {
    try {
        const { helpCenterId } = req.params;

        if (!helpCenterId) return res.status(400).json({ message: "helpCenterId is required" });

        let helpCenter = await HelpCenter.findOne({ _id: helpCenterId });
        if (!helpCenter) helpCenter = await HelpCenter.findOne({ ticketid: helpCenterId });

        if (!helpCenter) return res.status(404).json({ message: "Help center ticket not found" });

        if (helpCenter.status === "Resolved") {
            return res.status(400).json({ message: "Help center ticket is already resolved" });
        }

        const admin = req.user;
        const resolvedByName = admin ? `${admin.adminfirstname || ""} ${admin.adminlastname || ""}`.trim() || "Admin" : "Admin";

        helpCenter.status = "Resolved";
        helpCenter.resolvedby = resolvedByName;
        helpCenter.updatedAt = new Date().toISOString();
        await helpCenter.save();

        const miscSetting = await MiscSetting.findOne();
        const adminTimezone = miscSetting ? miscSetting.timeZone : "UTC";
        const adminDateTimeFormat = getAdminDateTimeFormat(miscSetting);

        return res.status(200).json({
            message: "Help center ticket resolved successfully",
            helpCenter: formatHelpCenterRecord(helpCenter.toObject(), adminDateTimeFormat, adminTimezone),
        });
    } catch (error) {
        console.log("Error resolving help center ticket:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_helpcenter_message = async (req, res) => {
    try {
        const { helpCenterId } = req.params;
        const { message, usertype } = req.body;

        if (!helpCenterId) return res.status(400).json({ message: "helpCenterId is required" });
        if (!message?.trim()) return res.status(400).json({ message: "Message is required" });

        let helpCenter = await HelpCenter.findOne({ _id: helpCenterId });
        if (!helpCenter) helpCenter = await HelpCenter.findOne({ ticketid: helpCenterId });

        if (!helpCenter) return res.status(404).json({ message: "Help center ticket not found" });

        if (helpCenter.status === "Resolved") {
            return res.status(400).json({ message: "Cannot send message on resolved ticket" });
        }

        const admin = req.user;
        const username = admin ? `${admin.adminfirstname || ""} ${admin.adminlastname || ""}`.trim() || "Admin" : "Admin";

        const nowIso = new Date().toISOString();
        const newMessage = {
            usertype: usertype || "admin",
            username,
            message: message.trim(),
            images: [],
            createdAt: nowIso,
        };

        if (!Array.isArray(helpCenter.messsages)) {
            helpCenter.messsages = [];
        }
        helpCenter.messsages.push(newMessage);
        helpCenter.updatedAt = nowIso;

        if (helpCenter.status === "Pending") {
            helpCenter.status = "Open";
        }

        await helpCenter.save();

        const miscSetting = await MiscSetting.findOne();
        const adminTimezone = miscSetting ? miscSetting.timeZone : "UTC";
        const adminDateTimeFormat = getAdminDateTimeFormat(miscSetting);

        return res.status(200).json({
            message: "Message sent successfully",
            helpCenter: formatHelpCenterRecord(helpCenter.toObject(), adminDateTimeFormat, adminTimezone),
        });
    } catch (error) {
        console.log("Error adding help center message:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_owner_helpcenter = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const { issuename, description } = req.body;

        if (!issuename?.trim() || !description?.trim()) {
            return res.status(400).json({ message: "Issue name and description are required" });
        }

        const maxTicket = await HelpCenter.findOne().sort({ ticketid: -1 }).lean();
        const nextTicketId = maxTicket?.ticketid ? Number(maxTicket.ticketid) + 1 : 1;

        const nowIso = new Date().toISOString();

        const newHelpCenter = new HelpCenter({
            ticketid: nextTicketId,
            ownerid: ownerId || 0,
            customerid: 0,
            employeeid: 0,
            username: "User",
            usertype: "admin",
            issuename: issuename.trim(),
            description: description.trim(),
            messsages: [],
            resolvedby: "",
            status: "Pending",
            createdAt: nowIso,
            updatedAt: nowIso,
        });

        await newHelpCenter.save();

        return res.status(201).json({
            message: "Help center ticket created successfully",
            helpCenter: newHelpCenter,
        });
    } catch (error) {
        console.log("Error adding owner help center:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_helpcenter,
    get_owner_helpcenter,
    get_helpcenter_by_id,
    resolve_helpcenter,
    add_helpcenter_message,
    add_owner_helpcenter,
};
