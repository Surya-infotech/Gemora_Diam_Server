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

const lookupCountryFromIp = async (ip) => {
    // 1. Try BigDataCloud
    try {
        const cleanIp = ip && !["127.0.0.1", "::1", "localhost"].includes(ip) ? `&ip=${ip}` : "";
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en${cleanIp}`);
        if (res.ok) {
            const data = await res.json();
            if (data.countryName) {
                return data.countryName;
            }
        }
    } catch {}

    // 2. Try ipwho.is
    try {
        const cleanIp = ip && !["127.0.0.1", "::1", "localhost"].includes(ip) ? ip : "";
        const res = await fetch(cleanIp ? `https://ipwho.is/${cleanIp}` : "https://ipwho.is/");
        if (res.ok) {
            const data = await res.json();
            if (data.country) {
                return data.country;
            }
        }
    } catch {}

    // 3. Try freeipapi
    try {
        const cleanIp = ip && !["127.0.0.1", "::1", "localhost"].includes(ip) ? cleanIp : "";
        const res = await fetch(cleanIp ? `https://freeipapi.com/api/json/${cleanIp}` : "https://freeipapi.com/api/json/");
        if (res.ok) {
            const data = await res.json();
            if (data.countryName) {
                return data.countryName;
            }
        }
    } catch {}

    return "";
};

const add_contactus = async (req, res) => {
    try {
        const { name, email, message, countryname, country } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Full name, email and message are required" });
        }

        let resolvedCountryName = (countryname || country || "").trim();

        // Server-side fallback: check Cloudflare, forwarder headers, or IP lookup
        if (!resolvedCountryName) {
            const cfCountry = req.headers["cf-ipcountry"];
            const headerCountry = req.headers["x-country-name"] || req.headers["x-country"];
            if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
                resolvedCountryName = resolveCountryFromCode(cfCountry.trim());
            } else if (headerCountry) {
                resolvedCountryName = String(headerCountry).trim();
            } else {
                const forwarded = req.headers["x-forwarded-for"];
                const clientIp = forwarded ? forwarded.split(",")[0].trim() : (req.socket?.remoteAddress || "");
                const lookupName = await lookupCountryFromIp(clientIp);
                if (lookupName) {
                    resolvedCountryName = lookupName;
                }
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
