import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";
import { Cargo } from "../../../domain/entities/Cargo";

export class ToggleCargoStatus {
    constructor(private readonly cargoRepository: ICargoRepository) { }

    async execute(id: string): Promise<Cargo> {
        const cargo = await this.cargoRepository.findById(id);
        if (!cargo) throw new Error('Cargo no encontrado');

        cargo.toggleEstado();
        return await this.cargoRepository.update(cargo);
    }
}
