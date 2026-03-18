import { Activo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

interface GetAllActivoInput {
}

export class GetAllActivo {
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(): Promise<Activo[]> {
        return await this.activoRepository.findAll();
    }
}