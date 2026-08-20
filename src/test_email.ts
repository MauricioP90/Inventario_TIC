import * as dotenv from 'dotenv';
dotenv.config();

import { EmailServiceFactory } from './infrastructure/services/EmailServiceFactory';
import { Movement } from './domain/entities/Movement';

async function main() {
    console.log('🚀 Probando servicio de correo...');
    console.log('Configuración actual:');
    console.log('  EMAIL_PROVIDER :', process.env.EMAIL_PROVIDER);
    console.log('  SMTP_HOST      :', process.env.SMTP_HOST);
    console.log('  SMTP_PORT      :', process.env.SMTP_PORT);
    console.log('  SMTP_USER      :', process.env.SMTP_USER);

    const emailService = EmailServiceFactory.create();

    const mockMovement = new Movement({
        id: 'test-movement-uuid-1234',
        type: 'TRASLADO_REGIONAL',
        originLocationId: 'loc-1',
        destinationLocationId: 'loc-2',
        responsibleId: 'resp-1',
        createdAt: new Date(),
        status: 'PENDING' as any,
        activoIds: ['act-1'],
        notes: 'Prueba de envío de correo con soporte y diseño corporativo.',
        documentUrl: 'http://localhost:9000/inventario-docs/comodatos/ejemplo.pdf'
    });

    const recipients = [process.env.SMTP_USER || 'test@example.com'];

    try {
        await emailService.sendMovementNotification(
            mockMovement,
            recipients,
            {
                activos: [
                    { placa: '1528-000000', marca: 'Lenovo', modelo: 'ThinkPad E14', serial: 'PF39X001' }
                ],
                originLocation: 'Bogotá (Sede Central)',
                destinationLocation: 'Villavicencio (Terminal)',
                responsibleName: 'Carlos Gómez'
            }
        );
        console.log('🎉 Envío de prueba finalizado con éxito.');
    } catch (error) {
        console.error('❌ Error en el envío de prueba:', error);
    }
}

main();
