// src/models/searchModel.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Search = sequelize.define("Search", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    origin: { type: DataTypes.STRING, allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    departureDate: { type: DataTypes.DATE, allowNull: false },
    returnDate: { type: DataTypes.DATE, allowNull: true },
    travelClass: { type: DataTypes.STRING, allowNull: false },
    passengers: { type: DataTypes.INTEGER, defaultValue: 1 },
});

export default Search;
