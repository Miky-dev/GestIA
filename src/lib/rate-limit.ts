import { RateLimiterMemory } from 'rate-limiter-flexible';

// Configurazione base: permette 5 tentativi per ogni chiave (IP o Email) ogni 15 minuti.
export const loginRateLimiter = new RateLimiterMemory({
    points: 5, // Numero di tentativi falliti permessi
    duration: 15 * 60, // Per 15 minuti (in secondi)
});
