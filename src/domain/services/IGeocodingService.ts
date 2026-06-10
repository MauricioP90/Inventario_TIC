export interface IGeocodingService {
    reverseGeocode(lat: number, lon: number): Promise<string>;
}
