import { Activo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

interface DarDeBajaActivoInput {
    placa: string;
}

export class DarDeBajaActivo {
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(input: DarDeBajaActivoInput): Promise<Activo> {
        const activo = await this.activoRepository.findByPlaca(input.placa);
        if (!activo) throw new Error('Activo no encontrado con la placa ' + input.placa);
        activo.darDeBaja();
        await this.activoRepository.save(activo);
        return activo;
    }
}