import type {ShippingProvider} from "./shipping.provider.js";
import type {PickupPointQuery} from "./shipping.types.js";

export class ShippingService {
    constructor(private provider: ShippingProvider) {
    }

    getProviderCode() {
        return this.provider.code;
    }

    getPickupPoints(q: PickupPointQuery) {
        return this.provider.getPickupPoints(q);
    }

    getPickupPointByCode(code: string) {
        return this.provider.getPickupPointByCode(code);
    }

    track(trackingNumber: string) {
        return this.provider.track(trackingNumber);
    }
}
