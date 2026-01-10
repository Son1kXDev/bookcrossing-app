import jwt, {type Secret, type SignOptions} from "jsonwebtoken";
import {env} from "../config/env.js";

export type JwtPayload = {
    sub: string;
};

const secret: Secret = env.JWT_SECRET;

export function signAccessToken(userId: bigint): string {
    const payload: JwtPayload = {sub: userId.toString()};

    const options: SignOptions = {
        expiresIn: env.JWT_EXPIRES_IN,
    };

    return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, secret) as JwtPayload;
}
