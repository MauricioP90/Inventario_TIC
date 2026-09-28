import { Activo } from "../entities/Activo";

export interface SearchActivosQuery {
    search?: string;
    tipoActivoId?: string;
    locationId?: string;
    responsibleId?: string;
    estado?: string;
    page?: number;
    limit?: number;
}

export interface SearchActivosResult {
    data: Activo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
