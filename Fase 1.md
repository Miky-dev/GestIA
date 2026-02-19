# Walkthrough - Fase 1: Autenticazione Multi-Tenant

## ✅ Cosa è stato implementato

### 1. Autenticazione Backend (NextAuth v5)
- **Configurazione**: `src/lib/auth.ts` con provider Credentials.
- **Strategia JWT**: Sessioni stateless, scalabili e sicure.
- **Multi-Tenant**: `companyId` e `role` sono iniettati nel token JWT e nella sessione utente.
- **Middleware**: Protezione globale delle rotte `/dashboard`, `/inbox`, `/customers`, `/calendar`. Le API non pubbliche restituiscono 401.

### 2. User Interface (Frontend)
- **Login Page**: `src/app/(auth)/login/page.tsx`
  - [x] UI pulita con shadcn/ui (Card, Input, Button).
  - [x] Validazione client-side con **Zod** e **React Hook Form**.
  - [x] Gestione errori server (es. "Credenziali non valide") con Alert.
  - [x] Feedback visivo di caricamento (spinner).
- **Dashboard**: `src/app/dashboard/layout.tsx`
  - [x] **Sidebar**: Navigazione, logo e logout.
  - [x] **Header**: Barra di ricerca e avatar utente.
  - [x] **Page**: Mostra i dati dell'utente loggato per confermare l'isolamento dei dati.

### 3. Database & Seed
- **Schema**: Prisma schema unificato con modelli `User`, `Company`, `Subscription`.
- **Seed Script**: `scripts/seed.ts` per popolare il DB con dati di test.

---

## 🚀 Come testare

1.  Assicurati che il server sia attivo:
    ```bash
    npm run dev
    ```

2.  Vai su [http://localhost:3000](http://localhost:3000). Verrai reindirizzato al login.

3.  Accedi con l'utente di test:
    - **Email**: `admin@demo.com`
    - **Password**: `password123`

4.  Verifica la Dashboard:
    - Controlla che il nome sia "Admin Demo".
    - Verifica che nella card "Isolamento Multi-Tenant" compaia un `Company ID` valido.
    - Prova il logout dal menu in basso a sinistra nella sidebar.

---

## 📦 Prossimi Passi (Fase 2)
- Implementare la gestione Clienti (CRUD).
- Creare la Inbox per la gestione messaggi.
- Collegare i dati reali della dashboard.
