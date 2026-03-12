import { Responsible } from "../entities/Responsible";

export interface IResponsibleRepository {
    getAll(): Promise<Responsible[]>;
    getById(id: string): Promise<Responsible | null>;
    create(responsible: Responsible): Promise<Responsible>;
    update(responsible: Responsible): Promise<Responsible>;
    inactive(id: string): Promise<void>;
    active(id: string): Promise<void>;
}
