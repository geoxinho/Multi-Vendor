import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    roles: string[];
    storeName?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      roles: string[];
      storeName?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    storeName?: string;
  }
}
