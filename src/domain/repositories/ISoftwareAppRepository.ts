import { SoftwareApp } from "../entities/SoftwareApp";

export interface ISoftwareAppRepository {
    save(app: SoftwareApp): Promise<void>;
    findById(id: string): Promise<SoftwareApp | null>;
    findByNombre(nombre: string): Promise<SoftwareApp | null>;
    findAll(): Promise<SoftwareApp[]>;
    update(app: SoftwareApp): Promise<SoftwareApp>;
}
