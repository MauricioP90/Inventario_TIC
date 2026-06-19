import { Area } from "../entities/Area";

export interface IAreaRepository {
    create(area: Area): Promise<Area>;
    update(area: Area): Promise<Area>;
    activate(id: string): Promise<Area>;
    inactivate(id: string): Promise<Area>;
    findById(id: string): Promise<Area | null>;
    findAll(): Promise<Area[]>;
}
