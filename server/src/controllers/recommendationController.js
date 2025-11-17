// src/controllers/recommendationController.js
import { Op } from "sequelize";
import { SearchHistory } from "../models/SearchHistory.js";

/**
 * GET /api/recommendations
 * Personalized suggestions based on recent user routes
 */
export async function getRecommendations(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Fetch last 20 searches
        const searches = await SearchHistory.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
            limit: 20,
        });

        if (!searches.length) {
            return res.json({
                success: true,
                message: "No recent searches yet.",
                recommendations: [],
            });
        }

        // Count frequency of routes (e.g., HYD→DXB)
        const routeCount = {};
        for (const s of searches) {
            if (!s.origin || !s.destination) continue;
            const key = `${s.origin}-${s.destination}`;
            routeCount[key] = (routeCount[key] || 0) + 1;
        }

        // Sort by most frequent routes
        const popularRoutes = Object.entries(routeCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([route]) => {
                const [origin, destination] = route.split("-");
                return { origin, destination };
            });

        return res.json({
            success: true,
            message: "Personalized flight recommendations",
            recommendations: popularRoutes.map((r) => ({
                origin: r.origin,
                destination: r.destination,
                suggestion: `Frequent route: ${r.origin} → ${r.destination}. Would you like me to check the latest fares?`,
            })),
        });
    } catch (err) {
        console.error("getRecommendations error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
    }
}
