import * as dotenv from 'dotenv';
dotenv.config();

import { EmailServiceFactory } from './infrastructure/services/EmailServiceFactory';
import { Movement } from './domain/entities/Movement';

async function main() {
    console.log('🚀 Probando servicio de correo...');
    console.log('Configuración actual:');
    console.log('  EMAIL_PROVIDER :', process.env.EMAIL_PROVIDER);
    console.log('  MAIL_API_URL   :', process.env.MAIL_API_URL);
    console.log('  MAIL_CONCEPTO  :', process.env.MAIL_CONCEPTO);

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
        notes: 'Prueba de envío de notificación mediante API REST interna de Flota La Macarena.',
        documentUrl: '' // Se enviará con la estructura vacía por defecto
    });

    const testRecipient = process.env.TEST_EMAIL_TO || 'analistasistemasdeinformacion@flotalamacarena.com';
    const testCc = process.env.TEST_EMAIL_CC ? [process.env.TEST_EMAIL_CC] : [];
    const recipients = [testRecipient, ...testCc];

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
