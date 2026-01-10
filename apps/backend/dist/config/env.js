function required(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env var: ${name}`);
    return v;
}
export const env = {
    PORT: Number(process.env.PORT ?? 3000),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "",
};
