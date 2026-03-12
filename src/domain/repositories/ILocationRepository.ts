import { Location } from "../entities/Location";

export interface ILocationRepository {
    save(location: Location): Promise<void>;
    findById(id: string): Promise<Location | null>;
    findAll(): Promise<Location[]>;
    update(location: Location): Promise<void>;
}