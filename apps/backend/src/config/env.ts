import {SignOptions} from "jsonwebtoken";

function required(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function parseExpiresIn(v: string | undefined): SignOptions["expiresIn"] {
    if (!v) return "7d";
    if (/^\d+$/.test(v)) return Number(v);
    return v as SignOptions["expiresIn"];
}

export const env = {
    PORT: Number(process.env.PORT ?? 3000),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: parseExpiresIn(process.env.JWT_EXPIRES_IN),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "",
};
