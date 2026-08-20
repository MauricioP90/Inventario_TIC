import { IEmailService } from '../../domain/services/IEmailService';
import { ConsoleEmailService } from './ConsoleEmailService';
import { NodemailerEmailService } from './NodemailerEmailService';

export class EmailServiceFactory {
    private static instance: IEmailService | null = null;

    public static create(): IEmailService {
        if (!this.instance) {
            const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase().trim();

            if (provider === 'smtp' || provider === 'nodemailer' || provider === 'gmail') {
                console.log('📧 [EmailServiceFactory] Inicializando servicio de correo real (SMTP / Nodemailer)...');
                this.instance = new NodemailerEmailService();
            } else {
                console.log('📝 [EmailServiceFactory] Inicializando servicio de correo en consola (ConsoleEmailService)...');
                this.instance = new ConsoleEmailService();
            }
        }
        return this.instance;
    }
}
