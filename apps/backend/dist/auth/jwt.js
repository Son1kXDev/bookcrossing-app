import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function signAccessToken(userId) {
    const payload = { sub: userId.toString() };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
