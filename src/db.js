const mongoose = require("mongoose");
const dns = require("dns");

// Ensure DNS resolution works reliably for MongoDB Atlas SRV records
try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (dnsErr) {
    console.warn("DNS server setup warning:", dnsErr.message);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log(`✅ Single Database Connected: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;