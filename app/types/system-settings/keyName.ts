export type KeyNameStatus = "ACTIVE" | "INACTIVE";

export interface KeyName {
  id: number;
  name: string;
  remark: string | null;
  status: KeyNameStatus;
  createdAt: string;
  createdBy: string;
  updatedBy: string;
  updatedOn: string;
}
