import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";
import { Cargo } from "../../../domain/entities/Cargo";

export class GetAllCargos {
    constructor(private readonly cargoRepository: ICargoRepository) { }

    async execute(): Promise<Cargo[]> {
        return await this.cargoRepository.findAll();
    }
}
