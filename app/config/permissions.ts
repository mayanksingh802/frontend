import type { Role } from "@/app/types/auth/auth";

export const permissions = {
  systemSettings: [
    // "SUPER_ADMIN",
    "SYSTEM",
  ] as Role[],

  manageAccounts: [
    "SYSTEM",
    "SUPER_ADMIN",
    "TMS_ADMIN"
  ] as Role[],

  //Company in manage Accounts
  organizationCompany: [
    "SYSTEM",
  ] as Role[],

  //company dropdown
  CompanyDropdown:[
    "SYSTEM",
  ] as Role[],

  moduleManagement: [
    "SUPER_ADMIN",
    "SYSTEM",
  ] as Role[],

  keyNameManagement: [
    "SUPER_ADMIN",
    "SYSTEM",
  ] as Role[],

  keyValueManagement: [
    "SUPER_ADMIN",
    "SYSTEM",
  ] as Role[],

  tms: [
    "SUPER_ADMIN",
    "TMS_ADMIN",
    "TMS_USER",
  ] as Role[],

  hris: [
    "SUPER_ADMIN",
    "HRIS_ADMIN",
    "HRIS_MANAGER",
    "HRIS_EMPLOYEE",
  ] as Role[],
};
