// src/models/SearchHistory.js
import { DataTypes } from "sequelize";
// import { sequelize } from "../config/db.js";
import sequelize from "../config/db.js";

export const SearchHistory = sequelize.define("SearchHistory", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    origin: DataTypes.STRING,
    destination: DataTypes.STRING,
    departureDate: DataTypes.STRING,
    returnDate: DataTypes.STRING,
    travelClass: DataTypes.STRING,
    passengers: DataTypes.INTEGER,
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
