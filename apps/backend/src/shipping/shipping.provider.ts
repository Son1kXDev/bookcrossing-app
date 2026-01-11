import type {PickupPoint, PickupPointQuery, TrackingInfo} from "./shipping.types.js";

export interface ShippingProvider {
    code: "cdek";

    getPickupPoints(query: PickupPointQuery): Promise<PickupPoint[]>;

    getPickupPointByCode(code: string): Promise<PickupPoint | null>;

    track(trackingNumber: string): Promise<TrackingInfo>;
}
