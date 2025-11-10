// src/models/User.js
import { DataTypes, Model } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../services/db.js";

class User extends Model {
    async validatePassword(password) {
        return bcrypt.compare(password, this.passwordHash);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: { isEmail: true },
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "User",
        tableName: "Users",
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
            },
        },
    }
);

export default User;
