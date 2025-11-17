// src/models/wishlistModel.js
import { DataTypes } from "sequelize";
// import { sequelize } from "../config/db.js";
import sequelize from "../config/db.js";

const Wishlist = sequelize.define("Wishlist", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    origin: DataTypes.STRING,
    destination: DataTypes.STRING,
    departureDate: DataTypes.STRING,
    returnDate: DataTypes.STRING,
    price: DataTypes.FLOAT,
    airline: DataTypes.STRING,
});

export default Wishlist;