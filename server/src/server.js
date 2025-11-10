// src/server.js
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { sequelize } from "./models/index.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
// import searchHistoryRoutes from "./routes/searchHistoryRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

import cron from "node-cron";
import { cleanupOldSearchHistory } from "./utils/cleanupOldHistory.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected successfully");

        await sequelize.sync({ alter: true });
        console.log("🧩 Database synchronized");

        // Register additional routes here
        app.use("/api/wishlist", wishlistRoutes);
        // app.use("/api/search", searchHistoryRoutes);
        app.use("/api/search", searchRoutes);

        // Register dashboard route
        app.use("/api/dashboard", dashboardRoutes);

        app.listen(PORT, () => {
            console.log(`🛫 EdgeFly backend running on port ${PORT}\n`);
            console.log(`EdgeFly URL: http://localhost:${PORT}\n`);

            console.log("📌 Available Endpoints:");
            console.log(` http://localhost:${PORT}/api/auth        → Auth`);
            console.log(` http://localhost:${PORT}/api/auth/register        → Sign Up`);
            console.log(` http://localhost:${PORT}/api/auth/login        → Sign In`);
            console.log(` http://localhost:${PORT}/api/auth/me        → Get User Info`);
            console.log(` http://localhost:${PORT}/api/auth/guest        → Guest Flight search`);
            console.log(` http://localhost:${PORT}/api/flights     → Flight search`);
            console.log(` http://localhost:${PORT}/api/agent/query       → EdgeAgent chat/query`);
            console.log(` http://localhost:${PORT}/api/recommendations → Flight recommendations`);
            console.log(` http://localhost:${PORT}/api/wishlist    → User wishlist`);
            console.log(` http://localhost:${PORT}/api/search      → User search history`);
            console.log(` http://localhost:${PORT}/api/dashboard   → User dashboard`);

            console.log(` http://localhost:${PORT}/api/auth/logout        → Sign Out`);
            console.log(` http://localhost:${PORT}/api/auth/unauthorized  → Unauthorized check`);

            console.log("\n✅ Server is ready for requests");
        });

    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
};

// Run daily at 2:00 AM to clean old search history
cron.schedule("0 2 * * *", async () => {
    console.log("⏰ Running daily cleanup of old search history...");
    await cleanupOldSearchHistory();
});

startServer();
