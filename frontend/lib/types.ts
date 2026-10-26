
export type View = "overview" | "properties" | "tenants" | "leases" | "rent" | "repairs";
export type Property = { id: string; name: string; address: string; type: string };
export type Unit = { id: string; propertyId: string; name: string };
export type Tenant = { id: string; name: string; phone: string; email: string };
export type Lease = {
  id: string;
  unitId: string;
  tenantId: string;
  start: string;
  end: string;
  rent: number;
  status: LeaseStatus;
};
export type LeaseStatus = "Active" | "Draft" | "Expired";
export type Repair = {
  id: string;
  unitId: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  status: RepairStatus;
};
export type RepairStatus = "Open" | "In progress" | "Done";
export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
};
export type ModalState =
  | { kind: "property" }
  | { kind: "tenant" }
  | { kind: "lease" }
  | { kind: "repair" }
  | { kind: "payment"; leaseId: string }
  | null;

  export type Payment = { id: string; leaseId: string; amount: number; month: string };