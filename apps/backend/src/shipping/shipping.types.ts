export type PickupPoint = {
    code: string;
    name: string;
    address: string;
    city: string;
    lat?: number;
    lng?: number;
};

export type PickupPointQuery = {
    countryCode?: string;
    city?: string;
    type?: "PVZ" | "POSTAMAT";
};

export type TrackingStatus =
    | "created"
    | "in_transit"
    | "arrived_to_pvz"
    | "delivered";

export type TrackingEvent = {
    status: TrackingStatus;
    at: string;
    description: string;
};

export type TrackingInfo = {
    trackingNumber: string;
    events: TrackingEvent[];
    currentStatus: TrackingStatus;
};
