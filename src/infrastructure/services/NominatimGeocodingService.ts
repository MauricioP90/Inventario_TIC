import { IGeocodingService, ReverseGeocodeResult } from "../../domain/services/IGeocodingService";

export class NominatimGeocodingService implements IGeocodingService {
    async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "CrossInventoryApp/1.0 (contacto-soporte@flotalamacarena.com)"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
            console.error("Error en geocodificación externa:", error.message || error);
            throw new Error("Error al geolocalizar");
        }
    }
}
