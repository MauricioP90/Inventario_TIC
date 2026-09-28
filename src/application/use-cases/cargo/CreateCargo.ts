import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";
import { Cargo, EstadoCargo } from "../../../domain/entities/Cargo";

function toTitleCase(str: string): string {
    return str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export class CreateCargo {
    constructor(private readonly cargoRepository: ICargoRepository) { }

    async execute(nombre: string, estado?: EstadoCargo): Promise<Cargo> {
        const nombreNormalizado = toTitleCase(nombre);

        const existente = await this.cargoRepository.findByNombreInsensitive(nombreNormalizado);
        if (existente) {
            throw new Error(`Ya existe el cargo "${existente.nombre}". Usa el existente o elige otro nombre.`);
        }

        const cargo = new Cargo({
            nombre: nombreNormalizado,
            estado: estado || EstadoCargo.ACTIVO,
        });

        return await this.cargoRepository.create(cargo);
    }
}
