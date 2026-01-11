import type {ShippingProvider} from "../shipping/shipping.provider.js";
import type {PickupPoint, PickupPointQuery, TrackingInfo} from "../shipping/shipping.types.js";
import {CdekClient} from "./cdek.client.js";

export class CdekShippingProvider implements ShippingProvider {
    code: "cdek" = "cdek";

    constructor(private client: CdekClient) {
    }

    async getPickupPoints(query: PickupPointQuery): Promise<PickupPoint[]> {
        const raw = await this.client.getOffices({
            city: query.city,
            type: query.type,
            country_code: query.countryCode,
        });

        return raw
            .map((o: any) => ({
                code: String(o.code),
                name: String(o.name ?? o.location?.address ?? o.code),
                address: String(o.location?.address ?? ""),
                city: String(o.location?.city ?? query.city ?? ""),
                lat: typeof o.location?.latitude === "number" ? o.location.latitude : undefined,
                lng: typeof o.location?.longitude === "number" ? o.location.longitude : undefined,
            }))
            .filter((p: PickupPoint) => p.code && p.address);
    }

    async getPickupPointByCode(code: string): Promise<PickupPoint | null> {
        const pickUpPoints = this.getPickupPoints({});

        const points = await pickUpPoints;
        const point = points.find((p) => p.code === code);
        return point || null;
    }

    track(trackingNumber: string): Promise<TrackingInfo> {
        return this.client.trackShipment(trackingNumber);
    }
}
