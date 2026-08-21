export type Role =
  | "SYSTEM"
  | "SUPER_ADMIN"
  | "TMS_USER"
  | "TMS_ADMIN"
  | "HRIS_EMPLOYEE"
  | "HRIS_MANAGER"
  | "HRIS_ADMIN";

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  companyName: string;
  companyCode: string;
  enabled: boolean;
  roles: Role[];
  alternateNumber: number;
  mobileNumber: number;
  createdBy: string;
  updatedBy: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: AuthUser;
}