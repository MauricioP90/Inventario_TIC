import { Activo } from '../entities/Activo';

export interface IActivoRepository {
    save(activo: Activo): Promise<void>;
    findByPlaca(placa: string): Promise<Activo | null>;
    findAll(): Promise<Activo[]>;
    update(activo: Activo): Promise<Activo>;
    findBySerial(serial: string): Promise<Activo | null>;
}
