import { Movement } from "../../domain/entities/Movement";
import { IEmailService } from "../../domain/services/IEmailService";

export class ConsoleEmailService implements IEmailService {

    async sendMovementNotification(
        movement: Movement,
        recipients: string[],
        details: {
            activos: any[];
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
        }
    ): Promise<void> {
        const timestamp = new Date().toLocaleString();
        const listaActivos = details.activos
            .map(act => `  • Placa: [${act.placa}] - ${act.marca} ${act.modelo} (S/N: ${act.serial || 'N/A'})`)
            .join('\n');
        // Impresión visual estructurada del soporte en los logs del servidor
        console.log(`
================================================================================
📧 [SERVICIO DE CORREOS - PROVEEDOR NATIVO]
================================================================================
Fecha de Envío : ${timestamp}
Movimiento ID   : ${movement.id}
Tipo Movimiento : ${movement.type}
Sede Origen     : ${details.originLocation}
Sede Destino    : ${details.destinationLocation}
Responsable     : ${details.responsibleName}
--------------------------------------------------------------------------------
Destinatarios Notificados:
${recipients.map(r => `  -> ${r}`).join('\n')}
--------------------------------------------------------------------------------
Equipos y Componentes Trasladados:
${listaActivos}
--------------------------------------------------------------------------------
Observaciones del Traslado:
  "${movement.notes || 'Sin observaciones adicionales.'}"
================================================================================
Soporte Digital Emitido de Forma Exitosa.
================================================================================
        `);
    }
}