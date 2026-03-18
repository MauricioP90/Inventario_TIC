import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Activo, EstadoActivo } from "../../../domain/entities/Activo";

// definimos la interface de entrada
interface createActivoInput {
    id: string;
    placa: string;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    estado: EstadoActivo;
    facturaUrl?: string;
    fechaIngreso: Date;

}


export class CreateActivo {
    // Inyectamos la INTERFAZ del repositorio (Arquitectura Hexagonal pura)
    constructor(private readonly activoRepository: IActivoRepository) { }

    async execute(input: createActivoInput): Promise<Activo> {

        const activo = new Activo(input);

        const existe = await this.activoRepository.findByPlaca(input.placa);
        const existeSerial = await this.activoRepository.findBySerial(input.serial);

        if (existe) {
            throw new Error('El activo con placa ' + input.placa + ' ya existe');
        }

        if (existeSerial) {
            throw new Error('El activo con serial ' + input.serial + ' ya existe');
        }

        await this.activoRepository.save(activo);
        return activo;
    }

}