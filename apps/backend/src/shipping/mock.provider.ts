import type {ShippingProvider} from "./shipping.provider.js";
import type {PickupPoint, TrackingInfo, TrackingStatus} from "./shipping.types.js";

const PVZ: Array<PickupPoint & { type: "PVZ" | "POSTAMAT"; countryCode: string }> = [
    {
        code: "MOCK_PVZ_1",
        name: "ПВЗ СДЭК #1",
        address: "ул. Пример, 1",
        city: "Москва",
        lat: 55.75,
        lng: 37.61,
        type: "PVZ",
        countryCode: "RU"
    },
    {
        code: "MOCK_PVZ_2",
        name: "ПВЗ СДЭК #2",
        address: "ул. Пример, 2",
        city: "Москва",
        lat: 55.76,
        lng: 37.62,
        type: "PVZ",
        countryCode: "RU"
    },
    {
        code: "MOCK_POST_1",
        name: "Постамат #1",
        address: "пр-т Пример, 10",
        city: "Москва",
        lat: 55.74,
        lng: 37.60,
        type: "POSTAMAT",
        countryCode: "RU"
    },

    {
        code: "SPB_PVZ_1",
        name: "ПВЗ СДЭК СПб #1",
        address: "Невский, 1",
        city: "Санкт-Петербург",
        lat: 59.93,
        lng: 30.33,
        type: "PVZ",
        countryCode: "RU"
    },
];

function nowIso() {
    return new Date().toISOString();
}

function statusRank(s: TrackingStatus): number {
    return ["created", "in_transit", "arrived_to_pvz", "delivered"].indexOf(s);
}

export const mockShippingProvider: ShippingProvider = {
    code: "cdek",

    async getPickupPoints(query) {
        const city = (query.city ?? "").trim().toLowerCase();
        const type = query.type;
        const countryCode = (query.countryCode ?? "RU").toUpperCase();

        return PVZ.filter(p => {
            if (countryCode && p.countryCode !== countryCode) return false;
            if (type && p.type !== type) return false;
            if (city && p.city.toLowerCase() !== city) return false;
            return true;
        }).map(({type: _t, countryCode: _c, ...rest}) => rest);
    },

    async getPickupPointByCode(code: string) {
        const found = PVZ.find(p => p.code === code);
        if (!found) return null;
        const {type: _t, countryCode: _c, ...rest} = found;
        return rest;
    },

    async track(trackingNumber: string): Promise<TrackingInfo> {
        const lastDigit = Number((trackingNumber.match(/\d(?!.*\d)/)?.[0] ?? "0"));
        const step = isNaN(lastDigit) ? 0 : (lastDigit % 4);

        const all: Array<{ status: TrackingStatus; description: string }> = [
            {status: "created", description: "Создано отправление"},
            {status: "in_transit", description: "В пути"},
            {status: "arrived_to_pvz", description: "Прибыло в ПВЗ"},
            {status: "delivered", description: "Выдано получателю"},
        ];

        const current = all[step]!.status;

        const events = all
            .filter(e => statusRank(e.status) <= statusRank(current))
            .map((e, idx) => ({
                status: e.status,
                at: new Date(Date.now() - (eventsBack(idx) * 60_000)).toISOString(),
                description: e.description,
            }));

        return {trackingNumber, events, currentStatus: current};
    },
};

function eventsBack(idx: number) {
    return [30, 20, 10, 1][idx] ?? 1;
}
