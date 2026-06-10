import { IGeocodingService } from "../../domain/services/IGeocodingService";

export class NominatimGeocodingService implements IGeocodingService {
    async reverseGeocode(lat: number, lon: number): Promise<string> {
        try {
            // Bypassear validación de certificados SSL por restricciones/inspección de red corporativa
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "CrossInventoryApp/1.0 (contacto-soporte@tu-dominio.com)"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as any;
            return data.display_name || "Dirección no encontrada";
        } catch (error: any) {
            console.error("Error en geocodificación externa:", error.message || error);
            throw new Error("Error al geolocalizar");
        }
    }
}
