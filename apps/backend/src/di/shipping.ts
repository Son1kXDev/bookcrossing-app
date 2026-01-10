import {env} from "../config/env.js";
import {ShippingService} from "../shipping/shipping.service.js";
import {mockShippingProvider} from "../shipping/mock.provider.js";
import {CdekClient} from "../cdek/cdek.client.js";
import {CdekShippingProvider} from "../cdek/cdek.provider.js";

export function buildShippingService(): ShippingService {
    if (env.SHIPPING_MODE === "mock") {
        return new ShippingService(mockShippingProvider);
    }

    const hasCdekCreds = !!env.CDEK_CLIENT_ID && !!env.CDEK_CLIENT_SECRET;
    if (!hasCdekCreds) {
        return new ShippingService(mockShippingProvider);
    }

    const client = new CdekClient();
    const provider = new CdekShippingProvider(client);
    return new ShippingService(provider);
}
