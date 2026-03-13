import { Responsible } from "../entities/Responsible";

export interface IResponsibleRepository {
    findAll(): Promise<Responsible[]>;
    findByNombre(nombre: string): Promise<Responsible | null>;
    findById(id: string): Promise<Responsible | null>;
    create(responsible: Responsible): Promise<Responsible>;
    update(responsible: Responsible): Promise<Responsible>;
}

