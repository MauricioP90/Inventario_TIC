import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location } from "../../../domain/entities/Location";

export class GetAllLocations {
    constructor(private readonly locationRepository: ILocationRepository) { }

    async execute(): Promise<Location[]> {
        return await this.locationRepository.findAll();
    }
}