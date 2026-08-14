export type KeyValueStatus = "ACTIVE" | "INACTIVE";

export interface KeyValue {
  id: number;
  key: string;
  value: string;
  remark: string | null;
  status: KeyValueStatus;
  createdAt: string;
  createdBy: string;
  updatedBy: string;
  updatedOn: string;
}
