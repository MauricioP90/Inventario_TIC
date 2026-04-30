import { Activo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

interface FindByIdActivoInput {
    id: string;
}

export class FindByIdActivo {
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(input: FindByIdActivoInput): Promise<Activo> {
        const activo = await this.activoRepository.findById(input.id);
        if (!activo) {
            throw new Error('El activo con id ' + input.id + ' no existe');
        }
        return activo;
    }
}