const ContactUs = require("../../../models/AdminPanel/Support/contactus-model");

const get_contactus = async (_req, res) => {
    try {
        const contactusList = await ContactUs.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json(contactusList);
    } catch (error) {
        console.log("Error fetching Contact Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const resolveCountryFromCode = (code) => {
    if (!code || typeof code !== "string") return "";
    try {
        const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
        return regionNames.of(code.toUpperCase().trim()) || code;
    } catch {
        return code;
    }
};

const add_contactus = async (req, res) => {
    try {
        const { name, email, message, countryname, countrycode, country } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Full name, email and message are required" });
        }

        let resolvedCountryName = (countryname || country || "").trim();
        let resolvedCountryCode = (countrycode || "").trim();

        // If code given but name empty, convert code to name
        if (!resolvedCountryName && resolvedCountryCode) {
            resolvedCountryName = resolveCountryFromCode(resolvedCountryCode);
        }

        // Server-side fallback: check Cloudflare or forwarder headers
        if (!resolvedCountryName) {
            const cfCountry = req.headers["cf-ipcountry"];
            const headerCountry = req.headers["x-country-name"] || req.headers["x-country"];
            if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
                resolvedCountryCode = resolvedCountryCode || cfCountry.trim();
                resolvedCountryName = resolveCountryFromCode(cfCountry.trim());
            } else if (headerCountry) {
                resolvedCountryName = String(headerCountry).trim();
            }
        }

        const maxContactUs = await ContactUs.findOne().sort({ contactusid: -1 });
        const nextContactUsId = maxContactUs ? parseInt(maxContactUs.contactusid, 10) + 1 : 1;

        const newContactUs = new ContactUs({
            contactusid: nextContactUsId,
            fullname: name.trim(),
            email: email.trim(),
            message: message.trim(),
            countryname: resolvedCountryName,
            countrycode: resolvedCountryCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        await newContactUs.save();
        return res.status(201).json({ message: "Contact us submitted successfully", contactus: newContactUs });
    } catch (error) {
        console.log("Error adding Contact Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_contactus, add_contactus };
