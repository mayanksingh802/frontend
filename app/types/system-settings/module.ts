export type ModuleStatus = "ACTIVE" | "INACTIVE";

export interface Module {
  id: string;
  code: string;
  name: string;
  remark: string | null;
  status: ModuleStatus;
  createdAt: string;
  createdBy: string;
  updatedBy: string;
  updatedOn: string;
}
