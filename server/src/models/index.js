// server/src/models/index.js
import sequelize from "../config/db.js";
import User from "./userModel.js";
import Search from "./searchModel.js";
import Wishlist from "./wishlistModel.js";

// Relations
User.hasMany(Search, { foreignKey: "userId" });
Search.belongsTo(User);

User.hasMany(Wishlist, { foreignKey: "userId" });
Wishlist.belongsTo(User);

export { sequelize, User, Search, Wishlist };
