import { SIMCard, EstadoSIM } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

// Definimos qué datos necesita este caso de uso para funcionar
interface CreateSIMCardInput {
    iccid: string;
    numero: string;
    operador: string;
    estado: EstadoSIM;
}

export class CreateSIMCard {
    // Inyectamos la INTERFAZ del repositorio (Arquitectura Hexagonal pura)
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: CreateSIMCardInput): Promise<SIMCard> {
        // 1. Creamos la entidad de dominio
        const simCard = new SIMCard(input);

        // 2. Validamos que no exista
        const existe = await this.simCardRepository.findByIccid(input.iccid);
        if (existe) {
            throw new Error('La SIM con ICCID ' + input.iccid + ' ya existe');
        }

        // 3. La guardamos usando el repositorio
        await this.simCardRepository.save(simCard);

        // 4. Devolvemos la entidad creada
        return simCard;
    }
}