# GestIA

GestIA è un software gestionale moderno e ibrido costruito con **Next.js**, progettato per gestire in modo efficiente l'anagrafica clienti, le comunicazioni e gli appuntamenti. L'infrastruttura unisce la flessibilità del client-side rendering con la robustezza delle Server Actions di Next.js per la gestione sicura dei dati.

## ✨ Funzionalità Principali

- **CRM e Anagrafica Clienti**: Gestione avanzata dei profili cliente, inclusi dati di contatto, codice fiscale, partita IVA, data di nascita e note interne.
- **Smart Calendar**: Calendario intelligente integrato (tramite FullCalendar) per gestire gli appuntamenti, con supporto al drag & drop, ridimensionamento degli eventi e visualizzazioni flessibili (settimana/mese/giorno).
- **Inbox e Comunicazioni**: Interfaccia dedicata alla messaggistica per monitorare e gestire le interazioni con i clienti in tempo reale.
- **Autenticazione Sicura**: Sistema di login con verifica obbligatoria dell'email (Email Verification Gate) per l'accesso ai ruoli e alle funzioni sensibili nel pannello di amministrazione.
- **Dashboard e Widget**: Dashboard direzionale dotata di widget informativi per monitorare lo stato dell'account e delle operazioni.

## 🛠️ Tecnologie Utilizzate

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Database & ORM**: [Prisma](https://www.prisma.io/)
- **Autenticazione**: [NextAuth.js](https://next-auth.js.org/) / Sessioni personalizzate e JWT
- **Validazione Dati**: [Zod](https://zod.dev/) integrato sia client-side che server-side.
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Modulistica**: [React Hook Form](https://react-hook-form.com/)
- **Calendario**: [FullCalendar](https://fullcalendar.io/)
- **Sicurezza**: Protezione anti-brute force (Rate limiting) ed email verification tokens.

## 🚀 Setup e Installazione

### Prerequisiti
- **Node.js** (versione 18 o superiore raccomandata)
- Un database compatibile con Prisma (es. SQLite in ambiente di sviluppo)

### Installazione

1. Clona il repository sulla tua macchina locale:
   ```bash
   git clone <il-tuo-repo-url>
   cd GestIA
   ```

2. Installa le dipendenze del progetto:
   ```bash
   npm install
   ```

3. Configura le variabili d'ambiente:
   Crea un file `.env` nella root del progetto (o usa un file di esempio se disponibile) e inserisci le chiavi necessarie (URL del database, chiavi di decrittazione JWT, ecc.).

4. Sincronizza il Database e genera il Client Prisma:
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
   
L'applicazione sarà ora disponibile all'indirizzo `http://localhost:3000`.

## 📜 Strumenti a riga di comando (Scripts)

Nello sviluppo quotidiano puoi usare questi comandi definiti nel `package.json`:

- `npm run dev`: Avvia l'ambiente di sviluppo in locale.
- `npm run build`: Compila l'applicazione per la produzione.
- `npm run start`: Esegue la build creata in ambiente di produzione.
- `npm run lint`: Esegue l'analisi statica del codice (ESLint).
- `npm run db:push`: Applica lo schema Prisma al database di destinazione rapidamente.
- `npm run db:migrate`: Usa il sistema di migrazioni di Prisma (ideale per la produzione).
- `npm run db:studio`: Apre l'interfaccia visiva di Prisma Studio nel browser per ispezionare facilmente il database.
