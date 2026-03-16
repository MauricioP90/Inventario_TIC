import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location } from "../../../domain/entities/Location";

export interface GetOneLocationInput {
    code: string;
}

export class GetOneLocationUseCase {
    constructor(private readonly locationRepository: ILocationRepository) { }

    async execute(input: GetOneLocationInput): Promise<Location> {
        const location = await this.locationRepository.findByCode(input.code);
        if (!location) {
            throw new Error('La ubicacion con codigo ' + input.code + ' no existe');
        }
        return location;
    }
}