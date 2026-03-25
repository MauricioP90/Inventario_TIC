import Keycloak from 'keycloak-connect';
import session from 'express-session';

const memoryStore = new session.MemoryStore();

const keycloakConfig = {
    realm: process.env.KEYCLOAK_REALM || 'inventory-realm',
    'auth-server-url': process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
    resource: process.env.KEYCLOAK_CLIENT_ID || 'inventory-backend',
    'ssl-required': 'external',
    'confidential-port': 0,
    'bearer-only': true // Importante para una API REST
};

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

export { keycloak, memoryStore };
