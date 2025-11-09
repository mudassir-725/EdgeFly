// src/middleware/logging.js
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import morgan from "morgan";
import path from "path";
import fs from "fs";

const logDir = "logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const transport = new DailyRotateFile({
    filename: path.join(logDir, "edgefly-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d"
});

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
    ),
    transports: [transport, new winston.transports.Console()]
});

// Express request logging middleware
const requestLogger = morgan("combined", {
    stream: {
        write: (msg) => logger.info(msg.trim())
    }
});

export { logger, requestLogger };
