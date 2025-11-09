// src/controllers/dashboardController.js
import { SearchHistory } from "../models/SearchHistory.js";
import wishlistModel from "../models/wishlistModel.js";
import { getRecommendations } from "./recommendationController.js"; // optional if recommendations are in DB

/**
 * GET /api/dashboard
 * Returns a smart snapshot of the user's activity:
 *  - recent searches
 *  - wishlist
 *  - suggested routes
 *  - top destinations
 *  - frequent airlines
 */
export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        // Fetch recent searches (limit 5)
        const recentSearches = await SearchHistory.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
            limit: 5,
        });

        // Wishlist items
        const wishlist = await wishlistModel.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
        });

        // Calculate top destinations
        const destCount = {};
        recentSearches.forEach(search => {
            if (search.destination) {
                destCount[search.destination] = (destCount[search.destination] || 0) + 1;
            }
        });
        const topDestinations = Object.entries(destCount)
            .sort(([, a], [, b]) => b - a)
            .map(([destination]) => destination);

        // Most traveled routes
        const routeCount = {};
        recentSearches.forEach(s => {
            if (s.origin && s.destination) {
                const route = `${s.origin}-${s.destination}`;
                routeCount[route] = (routeCount[route] || 0) + 1;
            }
        });
        const mostTraveledRoutes = Object.entries(routeCount)
            .sort(([, a], [, b]) => b - a)
            .map(([route]) => route);

        // Frequent airlines (from preferences)
        const airlineCount = {};
        recentSearches.forEach(s => {
            if (s.preferences?.airlines) {
                const airline = s.preferences.airlines;
                airlineCount[airline] = (airlineCount[airline] || 0) + 1;
            }
        });
        const frequentAirlines = Object.entries(airlineCount)
            .sort(([, a], [, b]) => b - a)
            .map(([airline]) => airline);

        return res.json({
            success: true,
            dashboard: {
                recentSearches,
                wishlist,
                suggestedRoutes: mostTraveledRoutes.filter(r => routeCount[r] >= 2),
                topDestinations,
                frequentAirlines,
            },
        });
    } catch (err) {
        console.error("Dashboard fetch error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
    }
};
