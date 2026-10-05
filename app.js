require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/db");
const adminRouter = require("./router/admin-router");
const systemrouteradmin = require("./router/AdminPanel/system-router");

const app = express();

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            "https://gemoradiam.com",
            "https://www.gemoradiam.com",
            "http://localhost:5173"
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check / Status Route
app.get("/Status", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Gemora Diam backend server is running!",
        timestamp: new Date().toISOString()
    });
});

app.use("/admin", adminRouter);
app.use("/System", systemrouteradmin);

const PORT = process.env.PORT || 8081;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Gemora Diam Server running on port ${PORT}`);
        console.log(`Health Check: http://localhost:${PORT}/Status`);
    });
}).catch((err) => {
    console.error("Failed to start server:", err);
});

module.exports = app;
