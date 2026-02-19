import { handlers } from "@/lib/auth";

// Gestisce GET e POST su /api/auth/* (login, logout, sessione, ecc.)
export const { GET, POST } = handlers;
