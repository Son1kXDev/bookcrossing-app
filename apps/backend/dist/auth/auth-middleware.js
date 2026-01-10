import { verifyAccessToken } from "./jwt.js";
export function authGuard(req, res, next) {
    const header = req.headers.authorization ?? "";
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
    }
    try {
        const payload = verifyAccessToken(token);
        req.userId = BigInt(payload.sub);
        next();
    }
    catch {
        return res.status(401).json({ error: "UNAUTHORIZED" });
    }
}
