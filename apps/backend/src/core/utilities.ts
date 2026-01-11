export function toBigInt(v: string | number): bigint {
    if (typeof v === "number") return BigInt(v);
    if (!/^\d+$/.test(v)) throw new Error("INVALID_ID");
    return BigInt(v);
}

export function getParamId(req: any, key: string): string | null {
    const raw = req.params?.[key];
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw[0] ?? null;
    return null;
}