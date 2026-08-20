declare module "#auth-utils" {
  interface User {
    id: string;
    email: string;
    name: string;
    avatarSrc?: string | null;
  }
}

declare module "h3" {
  interface H3EventContext {
    userId?: string;
  }
}

export {};
