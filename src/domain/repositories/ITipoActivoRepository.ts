import { TipoActivo } from "../entities/TipoActivo";

export interface ITipoActivoRepository {
    save(tipo: TipoActivo): Promise<void>;
    findAll(): Promise<TipoActivo[]>;
    findById(id: string): Promise<TipoActivo | null>;
    update(tipo: TipoActivo): Promise<TipoActivo>;
}