import { Activo, EstadoActivo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Location } from "../../../domain/entities/Location";
import { Responsible } from "../../../domain/entities/Responsible";

interface UpdateActivoInput {
    placa: string;
    estado?: EstadoActivo;
    location?: Location;
    responsable?: Responsible;
}

export class UpdateActivo {
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(input: UpdateActivoInput): Promise<Activo> {
        const activo = await this.activoRepository.findByPlaca(input.placa);
        if (!activo) throw new Error('Activo no encontrado');
        if (input.location) {
            activo.asignarUbicacion(input.location);
        }
        if (input.responsable) {
            activo.asignarResponsable(input.responsable);
        }
        if (input.estado) {
            activo.update({
                estado: input.estado as EstadoActivo,
            });
        }
        await this.activoRepository.save(activo);
        return activo;
    }
}