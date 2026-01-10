import {NextFunction, Request, Response} from "express";
import {verifyAccessToken} from "./jwt.js";

export type AuthedRequest = Request & { userId: bigint };

export function authGuard(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization ?? "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({error: "UNAUTHORIZED"});
    }

    try {
        const payload = verifyAccessToken(token);
        (req as AuthedRequest).userId = BigInt(payload.sub);
        next();
    } catch {
        return res.status(401).json({error: "UNAUTHORIZED"});
    }
}
