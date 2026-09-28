import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";
import { Cargo, EstadoCargo } from "../../../domain/entities/Cargo";

function toTitleCase(str: string): string {
    return str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export class UpdateCargo {
    constructor(private readonly cargoRepository: ICargoRepository) { }

    async execute(id: string, nombre?: string, estado?: EstadoCargo): Promise<Cargo> {
        const cargo = await this.cargoRepository.findById(id);
        if (!cargo) throw new Error('Cargo no encontrado');

        if (nombre && nombre.trim()) {
            const nombreNormalizado = toTitleCase(nombre);
            const existente = await this.cargoRepository.findByNombreInsensitive(nombreNormalizado);
            if (existente && existente.id !== id) {
                throw new Error(`Ya existe otro cargo con el nombre "${existente.nombre}".`);
            }
            cargo.updateNombre(nombreNormalizado);
        }

        if (estado) {
            if (estado === EstadoCargo.INACTIVO && cargo.estado === EstadoCargo.ACTIVO) {
                cargo.toggleEstado();
            } else if (estado === EstadoCargo.ACTIVO && cargo.estado === EstadoCargo.INACTIVO) {
                cargo.toggleEstado();
            }
        }

        return await this.cargoRepository.update(cargo);
    }
}
