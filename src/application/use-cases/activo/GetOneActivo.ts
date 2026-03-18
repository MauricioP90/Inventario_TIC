import { Activo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

interface GetOneActivoInput {
    placa: string;
}

export class GetOneActivo {
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(input: GetOneActivoInput): Promise<Activo> {
        const activo = await this.activoRepository.findByPlaca(input.placa);
        if (!activo) {
            throw new Error('El activo con placa ' + input.placa + ' no existe');
        }
        return activo;
    }
}