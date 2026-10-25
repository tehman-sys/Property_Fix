import type { Lease, Property, Repair, Tenant, Unit } from "./types";
/* ---------- Fake data (later this comes from the backend) ---------- */
export const properties: Property[] = [
  { id: "6ade3d311071b3a74943edca", name: "Maple House", address: "Sector F-7, Islamabad", type: "Apartments" },
  { id: "6ade3d9d1071b3a74943edcb", name: "Brookside Villas", address: "Bahria Town, Rawalpindi", type: "Villas" },
  { id: "6ade3dc11071b3a74943edcc", name: "Central Lofts", address: "Blue Area, Islamabad", type: "Mixed use" },
];
export const units: Unit[] = [
  { id: "u1", propertyId: "6ade3d311071b3a74943edca", name: "A-101" },
  { id: "u2", propertyId: "6ade3d311071b3a74943edca", name: "A-102" },
  { id: "u3", propertyId: "6ade3d311071b3a74943edca", name: "B-201" },
  { id: "u4", propertyId: "6ade3d9d1071b3a74943edcb", name: "Villa 1" },
  { id: "u5", propertyId: "6ade3d9d1071b3a74943edcb", name: "Villa 2" },
  { id: "u6", propertyId: "6ade3dc11071b3a74943edcc", name: "Loft 1" },
  { id: "u7", propertyId: "6ade3dc11071b3a74943edcc", name: "Loft 2" },
];
export const tenants: Tenant[] = [
  { id: "6ade4c4311eae1df3e04bbbe", name: "Olivia Martin", phone: "0300 1112233", email: "olivia@mail.com" },
  { id: "6ade4c4311eae1df3e04bbbf", name: "James Wilson", phone: "0301 2223344", email: "james@mail.com" },
  { id: "6ade4c4311eae1df3e04bbc0", name: "Emma Davis", phone: "0302 3334455", email: "emma@mail.com" },
  { id: "6ade4c4411eae1df3e04bbc1", name: "Noah Brown", phone: "0303 4445566", email: "noah@mail.com" },
  { id: "6ade4c4411eae1df3e04bbc2", name: "Sophie Taylor", phone: "0304 5556677", email: "sophie@mail.com" },
];
export const leases: Lease[] = [
  { id: "l1", unitId: "u1", tenantId: "6ade4c4311eae1df3e04bbbe", start: "2026-01-01", end: "2026-12-31", rent: 65000, status: "Active" },
  { id: "l2", unitId: "u2", tenantId: "6ade4c4311eae1df3e04bbbf", start: "2026-01-01", end: "2026-12-31", rent: 55000, status: "Active" },
  { id: "l3", unitId: "u4", tenantId: "6ade4c4411eae1df3e04bbc1", start: "2026-03-01", end: "2027-02-28", rent: 120000, status: "Active" },
  { id: "l4", unitId: "u5", tenantId: "6ade4c4411eae1df3e04bbc2", start: "2026-03-01", end: "2027-02-28", rent: 125000, status: "Active" },
  { id: "l5", unitId: "u6", tenantId: "6ade4c4311eae1df3e04bbc0", start: "2026-11-01", end: "2027-10-31", rent: 80000, status: "Draft" },
];
export const repairs: Repair[] = [
  { id: "r1", unitId: "u2", title: "Kitchen tap leaking", priority: "Medium", status: "Open" },
  { id: "r2", unitId: "u4", title: "AC not cooling", priority: "High", status: "In progress" },
  { id: "r3", unitId: "u1", title: "Hallway light replaced", priority: "Low", status: "Done" },
];

