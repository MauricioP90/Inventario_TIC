import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { EstadoSIM } from "../../../domain/entities/SIMCard";
import { EstadoActivo } from "../../../domain/entities/Activo";

interface AssingSIMToActivoInput {
    placa: string;
    ICCID: string;
}


export class AssingSIMToActivo {
    constructor(private readonly activoRepository: IActivoRepository, private readonly simRepository: ISIMCardRepository) { }

    async execute(input: AssingSIMToActivoInput): Promise<void> {
        const activo = await this.activoRepository.findByPlaca(input.placa);
        const sim = await this.simRepository.findByIccid(input.ICCID);

        if (!activo || !sim) throw new Error('Activo o SIM no encontrado');
        if (sim.estado !== EstadoSIM.BODEGA) throw new Error('La SIM no está disponible');
        if (activo.estado !== EstadoActivo.BODEGA) throw new Error('El activo no está disponible');
        if (sim.activoId) throw new Error('La SIM ya está asignada a otro activo');

        sim.asignarAActivo(activo.id!);
        activo.asignarSIMCard(sim);

        await this.simRepository.save(sim);
        await this.activoRepository.save(activo);
    }
}