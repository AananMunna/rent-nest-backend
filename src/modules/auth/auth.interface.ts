export interface ILoginUser {
  email: string;
  password: string;
}

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role?: "TENANT" | "LANDLORD";
  phone?: string;
  avatarUrl?: string;
  address?: string;
  bio?: string;
}
