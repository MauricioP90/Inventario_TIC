export interface ReverseGeocodeResult {
    address: string;
    city: string;
}

export interface IGeocodingService {
    reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult>;
}
