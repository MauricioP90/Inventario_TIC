import { Activo } from '../entities/Activo';
import { SearchActivosQuery, SearchActivosResult } from './SearchActivosQuery';

export interface IActivoRepository {
    save(activo: Activo): Promise<void>;
    findByPlaca(placa: string): Promise<Activo | null>;
    findAll(): Promise<Activo[]>;
    search(query: SearchActivosQuery): Promise<SearchActivosResult>;
    update(activo: Activo): Promise<Activo>;
    findBySerial(serial: string): Promise<Activo | null>;
    countByResponsibleId(responsibleId: string): Promise<number>;
    findById(id: string): Promise<Activo | null>;
}
