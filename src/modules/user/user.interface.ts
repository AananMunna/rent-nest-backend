export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  role?: "TENANT" | "LANDLORD";
  phone?: string;
  avatarUrl?: string;
  address?: string;
  bio?: string;
}
