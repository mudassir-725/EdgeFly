// src/utils/cleanupOldHistory.js
import { Op } from "sequelize";
import { SearchHistory } from "../models/SearchHistory.js";

export async function cleanupOldSearchHistory() {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        const deletedCount = await SearchHistory.destroy({
            where: { createdAt: { [Op.lt]: cutoffDate } },
        });

        if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} old search history records`);
        }
    } catch (err) {
        console.error("Cleanup failed:", err);
    }
}
