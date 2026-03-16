import { Location } from "../entities/Location";

export interface ILocationRepository {
    save(location: Location): Promise<void>;
    findAll(): Promise<Location[]>;
    update(location: Location): Promise<void>;
    findByCode(code: string): Promise<Location | null>;
}