import {env} from "../config/env.js";
import {TrackingInfo} from "../shipping/shipping.types.js";

type TokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
};

export class CdekClient {
    private accessToken: string | null = null;
    private tokenExpiresAt = 0;

    private baseUrl: string;

    constructor() {
        this.baseUrl = env.CDEK_BASE_URL ?? "https://api.cdek.ru/v2";
    }

    async getOffices(params: { city?: string; type?: "PVZ" | "POSTAMAT"; country_code?: string }) {
        const token = await this.getToken();

        const qs = new URLSearchParams();
        if (params.city) qs.set("city", params.city);
        if (params.type) qs.set("type", params.type === "PVZ" ? "PVZ" : "POSTAMAT");
        if (params.country_code) qs.set("country_code", params.country_code);

        const url = `${this.baseUrl}/deliverypoints?${qs.toString()}`;

        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`CDEK deliverypoints error: ${resp.status} ${text}`);
        }

        return (await resp.json()) as any[];
    }

    async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
        const tokenPromise = this.getToken();

        const token = await tokenPromise;
        const url = `${this.baseUrl}/tracking?cdek_number=${encodeURIComponent(trackingNumber)}`;
        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`CDEK tracking error: ${resp.status} ${text}`);
        }
        const json = await resp.json();
        return {
            trackingNumber,
            currentStatus: json.items[0]?.status || "UNKNOWN",
            events: (json.items[0]?.events || []).map((event: any) => ({
                date: event.date,
                location: event.city,
                status: event.status,
                description: event.description,
            })),
        };
    }

    private async getToken(): Promise<string> {
        const now = Date.now();
        if (this.accessToken && now < this.tokenExpiresAt - 30_000) return this.accessToken;

        const clientId = env.CDEK_CLIENT_ID;
        const clientSecret = env.CDEK_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            throw new Error("CDEK credentials are not set (CDEK_CLIENT_ID / CDEK_CLIENT_SECRET)");
        }

        const body = new URLSearchParams();
        body.set("grant_type", "client_credentials");
        body.set("client_id", clientId);
        body.set("client_secret", clientSecret);

        const resp = await fetch(`${this.baseUrl}/oauth/token`, {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body,
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`CDEK token error: ${resp.status} ${text}`);
        }

        const json = (await resp.json()) as TokenResponse;
        this.accessToken = json.access_token;
        this.tokenExpiresAt = Date.now() + json.expires_in * 1000;
        return this.accessToken;
    }
}
