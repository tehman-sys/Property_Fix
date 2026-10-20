import type { Lease, Property, Repair, Tenant, Unit } from "./types";

/* ---------- Fake data (later this comes from the backend) ---------- */
export const properties: Property[] = [
  { id: "p1", name: "Maple House", address: "Sector F-7, Islamabad", type: "Apartments" },
  { id: "p2", name: "Brookside Villas", address: "Bahria Town, Rawalpindi", type: "Villas" },
  { id: "p3", name: "Central Lofts", address: "Blue Area, Islamabad", type: "Mixed use" },
];
export const units: Unit[] = [
  { id: "u1", propertyId: "p1", name: "A-101" },
  { id: "u2", propertyId: "p1", name: "A-102" },
  { id: "u3", propertyId: "p1", name: "B-201" },
  { id: "u4", propertyId: "p2", name: "Villa 1" },
  { id: "u5", propertyId: "p2", name: "Villa 2" },
  { id: "u6", propertyId: "p3", name: "Loft 1" },
  { id: "u7", propertyId: "p3", name: "Loft 2" },
];
export const tenants: Tenant[] = [
  { id: "t1", name: "Olivia Martin", phone: "0300 1112233", email: "olivia@mail.com" },
  { id: "t2", name: "James Wilson", phone: "0301 2223344", email: "james@mail.com" },
  { id: "t3", name: "Emma Davis", phone: "0302 3334455", email: "emma@mail.com" },
  { id: "t4", name: "Noah Brown", phone: "0303 4445566", email: "noah@mail.com" },
  { id: "t5", name: "Sophie Taylor", phone: "0304 5556677", email: "sophie@mail.com" },
];
export const leases: Lease[] = [
  { id: "l1", unitId: "u1", tenantId: "t1", start: "2026-01-01", end: "2026-12-31", rent: 65000, status: "Active" },
  { id: "l2", unitId: "u2", tenantId: "t2", start: "2026-01-01", end: "2026-12-31", rent: 55000, status: "Active" },
  { id: "l3", unitId: "u4", tenantId: "t4", start: "2026-03-01", end: "2027-02-28", rent: 120000, status: "Active" },
  { id: "l4", unitId: "u5", tenantId: "t5", start: "2026-03-01", end: "2027-02-28", rent: 125000, status: "Active" },
  { id: "l5", unitId: "u6", tenantId: "t3", start: "2026-11-01", end: "2027-10-31", rent: 80000, status: "Draft" },
];
export const repairs: Repair[] = [
  { id: "r1", unitId: "u2", title: "Kitchen tap leaking", priority: "Medium", status: "Open" },
  { id: "r2", unitId: "u4", title: "AC not cooling", priority: "High", status: "In progress" },
  { id: "r3", unitId: "u1", title: "Hallway light replaced", priority: "Low", status: "Done" },
];

