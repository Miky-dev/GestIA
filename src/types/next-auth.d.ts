import { Role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            companyId: string;
            role: Role;
            isEmailVerified: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        companyId: string;
        role: Role;
        isEmailVerified: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        companyId: string;
        role: Role;
        isEmailVerified: boolean;
    }
}

