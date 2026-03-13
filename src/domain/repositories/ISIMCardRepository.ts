import { SIMCard } from "../entities/SIMCard";

export interface ISIMCardRepository {
    save(simCard: SIMCard): Promise<void>;
    findById(id: string): Promise<SIMCard | null>;
    findByNumero(numero: string): Promise<SIMCard | null>;
    findAll(): Promise<SIMCard[]>;
    findByIccid(iccid: string): Promise<SIMCard | null>;
}
