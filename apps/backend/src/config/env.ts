import {SignOptions} from "jsonwebtoken";

function required(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function optional(name: string): string | undefined {
    const v = process.env[name];
    return v ? v : undefined;
}

function parseExpiresIn(v: string | undefined): SignOptions["expiresIn"] {
    if (!v) return "7d";
    if (/^\d+$/.test(v)) return Number(v);
    return v as SignOptions["expiresIn"];
}

export const env = {
    PORT: Number(process.env.BACKEND_PORT ?? 3000),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: parseExpiresIn(process.env.JWT_EXPIRES_IN),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "",
    SHIPPING_MODE: optional("SHIPPING_MODE") ?? "mock",
    CDEK_CLIENT_ID: optional("CDEK_CLIENT_ID"),
    CDEK_CLIENT_SECRET: optional("CDEK_CLIENT_SECRET"),
    CDEK_BASE_URL: optional("CDEK_BASE_URL"),
};
