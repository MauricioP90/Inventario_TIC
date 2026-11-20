import { IGeocodingService, ReverseGeocodeResult } from "../../domain/services/IGeocodingService";

export class NominatimGeocodingService implements IGeocodingService {
    async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`;
            const response = await fetch(url, {
                method: "GET",
                signal: AbortSignal.timeout(4000),
                headers: {
                    "User-Agent": "CrossInventoryApp/1.0 (contacto-soporte@flotalamacarena.com)"
                }
            });

            if (!response.ok) {
                console.warn(`Geocodificación externa respondió status ${response.status}; degradando sin ciudad automática.`);
                return { address: "", city: "" };
            }

            const data = await response.json() as any;
            const address = data.display_name || "Dirección no encontrada";
            const addrObj = data.address || {};

            // Prioridades para extraer municipio/ciudad en Colombia
            const rawCity = addrObj.city || addrObj.town || addrObj.municipality || addrObj.county || addrObj.village || addrObj.state || "";
            
            // Limpieza de prefijos y sufijos de OpenStreetMap
            const cleanCity = rawCity
                .replace(/^(Perímetro Urbano|Municipio de)\s+/i, '')
                .replace(/\s+ciudad$/i, '')
                .replace(/,\s*Distrito Capital$/i, '')
                .trim();

            return {
                address,
                city: cleanCity
            };
        } catch (error: any) {
            console.warn("Error en geocodificación externa (degradación controlada):", error.message || error);
            return { address: "", city: "" };
        }
    }
}
