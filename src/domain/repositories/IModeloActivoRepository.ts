import { ModeloActivo } from "../entities/ModeloActivo";

export interface IModeloActivoRepository {
    save(modelo: ModeloActivo): Promise<void>;
    findAll(): Promise<ModeloActivo[]>;
    findByTipoActivoId(tipoActivoId: string): Promise<ModeloActivo[]>;
    findById(id: string): Promise<ModeloActivo | null>;
    update(modelo: ModeloActivo): Promise<ModeloActivo>;
    delete(id: string): Promise<void>;
}
