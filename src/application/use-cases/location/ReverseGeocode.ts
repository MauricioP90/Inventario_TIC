import { IGeocodingService, ReverseGeocodeResult } from "../../../domain/services/IGeocodingService";

export class ReverseGeocode {
    constructor(private readonly geocodingService: IGeocodingService) {}

    async execute(lat: number, lon: number): Promise<ReverseGeocodeResult> {
        return await this.geocodingService.reverseGeocode(lat, lon);
    }
}
