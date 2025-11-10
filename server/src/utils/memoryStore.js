// src/utils/memoryStore.js
const memory = new Map();
const EXPIRATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export function getUserContext(userId) {
    const record = memory.get(userId);
    if (!record) return null;
    if (Date.now() - record.timestamp > EXPIRATION_MS) {
        memory.delete(userId);
        return null;
    }
    return record;
}

export function setUserContext(userId, context) {
    memory.set(userId, { ...context, timestamp: Date.now() });
}

export function clearUserContext(userId) {
    memory.delete(userId);
}
