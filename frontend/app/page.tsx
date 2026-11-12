"use client";

import { useEffect, useState } from "react";
import { Modal } from "../components/Parts";
import { btnGhost, nav } from "../lib/ui";
import type { User, Lease, ModalState, Property, Payment, Repair, RepairStatus, Unit, Tenant, View } from "../lib/types";
import { LeasesView } from "../views/LeasesView";
import { OverviewView } from "../views/OverviewView";
import { PropertiesView } from "../views/PropertiesView";
import { RentView } from "../views/RentView";
import { RepairsView } from "../views/RepairsView";
import { TenantsView } from "../views/TenantsView";
import { AuthScreen } from "../components/AuthScreen";
import { authFetch, clearToken, getToken } from "../lib/api";

const nextStatus: Record<RepairStatus, RepairStatus> = {
  Open: "In progress",
  "In progress": "Done",
  Done: "Open",
};


const API = process.env.NEXT_PUBLIC_API_URL;

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  /* ---------- State: the data that can change ---------- */
  const [view, setView] = useState<View>("overview");
  const [modal, setModal] = useState<ModalState>(null);
  const [props, setProps] = useState<Property[]>([]);
  const [tenantList, setTenantList] = useState<Tenant[]>([]);
  const [unitList, setUnitList] = useState<Unit[]>([]);
  const [leaseList, setLeaseList] = useState<Lease[]>([]);
  const [repairList, setRepairList] = useState<Repair[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const get = (path: string) => authFetch(`${API}/api/${path}`).then((r) => r.json());
    Promise.all([
      get("properties"), get("units"), get("tenants"),
      get("leases"), get("repairs"), get("payments"),
    ])
      .then(([p, u, t, l, r, pay]) => {
        setProps(p.properties ?? []);
        setUnitList(u.units ?? []);
        setTenantList(t.tenants ?? []);
        setLeaseList(l.leases ?? []);
        setRepairList(r.repairs ?? []);
        setPayments(pay.payments ?? []);
      })
      .catch(() => alert("Could not reach the server"));
  }, []);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const [rentMonth, setRentMonth] = useState(thisMonth);
  const [monthPayments, setMonthPayments] = useState<Payment[]>([]);

  useEffect(() => {
    authFetch(`${API}/api/payments?month=${rentMonth}`)
      .then((r) => r.json())
      .then((data) => setMonthPayments(data.payments ?? []))
      .catch(() => alert("Could not reach the server"));
  }, [rentMonth]);

  /* ---------- Helpers and totals computed from the state ---------- */
  const unitLabel = (id: string) => {
    const u = unitList.find((x) => x.id === id);
    if (!u) return "—";
    const p = props.find((x) => x.id === u.propertyId);
    return `${p?.name ?? ""} / ${u.name}`;
  };
  const tenantName = (id: string) => tenantList.find((t) => t.id === id)?.name ?? "—";
  const activeLeases = leaseList.filter((l) => l.status === "Active");
  const paid: Record<string, number> = {};
  for (const p of payments) paid[p.leaseId] = (paid[p.leaseId] ?? 0) + p.amount;
  const balance = (l: Lease) => l.rent - (paid[l.id] ?? 0);
  const rentLeases = leaseList.filter(
    (l) => l.status !== "Draft" && l.start.slice(0, 7) <= rentMonth && l.end.slice(0, 7) >= rentMonth
  );
  const rentPaid: Record<string, number> = {};
  for (const p of monthPayments) rentPaid[p.leaseId] = (rentPaid[p.leaseId] ?? 0) + p.amount;

  const expected = activeLeases.reduce((s, l) => s + l.rent, 0);
  const collected = activeLeases.reduce((s, l) => s + (paid[l.id] ?? 0), 0);
  const occupiedUnits = new Set(activeLeases.map((l) => l.unitId)).size;
  const openRepairs = repairList.filter((r) => r.status !== "Done");
  const pct = expected ? Math.round((collected / expected) * 100) : 0;

  const unitOptions = unitList.map((u) => ({ value: u.id, label: unitLabel(u.id) }));
  const tenantOptions = tenantList.map((t) => ({ value: t.id, label: t.name }));
  const closeModal = () => setModal(null);

  const signLease = async (id: string) => {
    const res = await authFetch(`${API}/api/leases/${id}/sign`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not sign the lease");
      return;
    }
    setLeaseList((all) => all.map((x) => (x.id === id ? data : x)));
  };

  const advanceRepair = async (id: string) => {
    const repair = repairList.find((x) => x.id === id);
    if (!repair) return;
    const res = await authFetch(`${API}/api/repairs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus[repair.status] }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Could not update the repair");
      return;
    }
    setRepairList((all) => all.map((x) => (x.id === id ? data : x)));
  };

  async function deleteTenant(id: string) {
    if (!confirm("Delete this tenant?")) return;
    try {
      const res = await authFetch(`${API}/api/tenants/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setTenantList((all) => all.filter((t) => t.id !== id));
    } catch {
      alert("Could not reach the server");
    }
  }

  async function deleteLease(id: string) {
    if (!confirm("Delete this lease and its payments?")) return;
    try {
      const res = await authFetch(`${API}/api/leases/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setLeaseList((all) => all.filter((l) => l.id !== id));
      setPayments((all) => all.filter((p) => p.leaseId !== id));
      setMonthPayments((all) => all.filter((p) => p.leaseId !== id));
    } catch {
      alert("Could not reach the server");
    }
  }

  async function deleteProperty(id: string) {
    if (!confirm("Delete this property and all its units, leases and repairs?")) return;
    try {
      const res = await authFetch(`${API}/api/properties/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      const goneUnits = new Set(unitList.filter((u) => u.propertyId === id).map((u) => u.id));
      const goneLeases = new Set(leaseList.filter((l) => goneUnits.has(l.unitId)).map((l) => l.id));
      setProps((all) => all.filter((p) => p.id !== id));
      setUnitList((all) => all.filter((u) => !goneUnits.has(u.id)));
      setLeaseList((all) => all.filter((l) => !goneUnits.has(l.unitId)));
      setPayments((all) => all.filter((p) => !goneLeases.has(p.leaseId)));
      setRepairList((all) => all.filter((r) => !goneUnits.has(r.unitId)));
    } catch {
      alert("Could not reach the server");
    }
  }

  async function deleteRepair(id: string) {
    if (!confirm("Delete this repair?")) return;
    try {
      const res = await authFetch(`${API}/api/repairs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setRepairList((all) => all.filter((r) => r.id !== id));
    } catch {
      alert("Could not reach the server");
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white p-5 md:block">
        <p className="mb-8 text-lg font-semibold tracking-tight">PropertyFix</p>
        <nav className="space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${view === n.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
                }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-stone-100 pt-4 text-sm">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs text-stone-500">{user.email}</p>
          <button className={`${btnGhost} mt-3 w-full`} onClick={onLogout}>Log out</button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Top nav (mobile) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white p-2 md:hidden">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${view === n.id ? "bg-stone-900 text-white" : "text-stone-600"
                }`}
            >
              {n.label}
            </button>
          ))}
          <button className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-stone-600" onClick={onLogout}>
            Log out
          </button>
        </nav>

        {/* The screen that matches the selected tab */}
        <main className="mx-auto max-w-5xl p-6 md:p-10">
          {view === "overview" && (
            <OverviewView
              propertyCount={props.length}
              occupiedUnits={occupiedUnits}
              expected={expected}
              collected={collected}
              pct={pct}
              openRepairs={openRepairs}
              unpaid={activeLeases.filter((l) => balance(l) > 0)}
              drafts={leaseList.filter((l) => l.status === "Draft")}
              balance={balance}
              tenantName={tenantName}
              unitLabel={unitLabel}
              goTo={setView}
              units={unitList}
            />
          )}
          {view === "properties" && (
            <PropertiesView
              properties={props}
              activeLeases={activeLeases}
              onAdd={() => setModal({ kind: "property" })}
              onDelete={deleteProperty}
              units={unitList}
              onAddUnit={(propertyId) => setModal({ kind: "unit", propertyId })}
              onEdit={(p) => setModal({ kind: "editProperty", property: p })}
            />
          )}
          {view === "tenants" && (
            <TenantsView
              tenants={tenantList}
              activeLeases={activeLeases}
              unitLabel={unitLabel}
              onAdd={() => setModal({ kind: "tenant" })}
              onDelete={deleteTenant}
              onEdit={(t) => setModal({ kind: "editTenant", tenant: t })}
            />
          )}
          {view === "leases" && (
            <LeasesView
              leases={leaseList}
              tenantName={tenantName}
              unitLabel={unitLabel}
              onCreate={() => setModal({ kind: "lease" })}
              onSign={signLease}
              onDelete={deleteLease}
              onEdit={(l) => setModal({ kind: "editLease", lease: l })}
            />
          )}
          {view === "rent" && (
            <RentView
              leases={rentLeases}
              month={rentMonth}
              isCurrent={rentMonth === thisMonth}
              paid={rentPaid}
              tenantName={tenantName}
              unitLabel={unitLabel}
              onMonthChange={setRentMonth}
              onRecord={(leaseId) => setModal({ kind: "payment", leaseId })}
            />
          )}
          {view === "repairs" && (
            <RepairsView
              repairs={repairList}
              unitLabel={unitLabel}
              onReport={() => setModal({ kind: "repair" })}
              onNext={advanceRepair}
              onDelete={deleteRepair}
            />
          )}
        </main>
      </div>

      {/* ---------- Pop-up forms ---------- */}
      {modal?.kind === "property" && (
        <Modal
          title="Add property"
          submitLabel="Save"
          fields={[
            { name: "name", label: "Name" },
            { name: "address", label: "Address" },
            { name: "type", label: "Type (e.g. Apartments)" },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const res = await authFetch(`${API}/api/properties`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: v.name, address: v.address, type: v.type }),
            });
            if (!res.ok) {
              alert("Could not save the property");
              return;
            }
            const created = await res.json();
            setProps((all) => [...all, created]);
            closeModal();
          }}
        />
      )}

      {modal?.kind === "editProperty" && (
        <Modal
          title="Edit property"
          submitLabel="Save changes"
          fields={[
            { name: "name", label: "Name", defaultValue: modal.property.name },
            { name: "address", label: "Address", defaultValue: modal.property.address },
            { name: "type", label: "Type (e.g. Apartments)", defaultValue: modal.property.type },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const id = modal.property.id;
            const res = await authFetch(`${API}/api/properties/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: v.name, address: v.address, type: v.type }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not update the property");
              return;
            }
            setProps((all) => all.map((p) => (p.id === id ? data : p)));
            closeModal();
          }}
        />
      )}

      {modal?.kind === "editTenant" && (
        <Modal
          title="Edit tenant"
          submitLabel="Save changes"
          fields={[
            { name: "name", label: "Full name", defaultValue: modal.tenant.name },
            { name: "phone", label: "Phone", defaultValue: modal.tenant.phone },
            { name: "email", label: "Email", type: "email", defaultValue: modal.tenant.email },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const id = modal.tenant.id;
            const res = await authFetch(`${API}/api/tenants/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: v.name, phone: v.phone, email: v.email }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not update the tenant");
              return;
            }
            setTenantList((all) => all.map((t) => (t.id === id ? data : t)));
            closeModal();
          }}
        />
      )}

      {modal?.kind === "editLease" && (
        <Modal
          title="Edit lease"
          submitLabel="Save changes"
          fields={[
            { name: "start", label: "Start date", type: "date", defaultValue: modal.lease.start },
            { name: "end", label: "End date", type: "date", defaultValue: modal.lease.end },
            { name: "rent", label: "Monthly rent", type: "number", defaultValue: String(modal.lease.rent) },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const id = modal.lease.id;
            const res = await authFetch(`${API}/api/leases/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ start: v.start, end: v.end, rent: Number(v.rent) }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not update the lease");
              return;
            }
            setLeaseList((all) => all.map((l) => (l.id === id ? data : l)));
            closeModal();
          }}
        />
      )}

      {modal?.kind === "unit" && (
        <Modal
          title="Add unit"
          submitLabel="Save"
          fields={[{ name: "name", label: "Unit name (e.g. A-101)" }]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const res = await authFetch(`${API}/api/units`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ propertyId: modal.propertyId, name: v.name }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not save the unit");
              return;
            }
            setUnitList((all) => [...all, data]);
            closeModal();
          }}
        />
      )}

      {modal?.kind === "tenant" && (
        <Modal
          title="Add tenant"
          submitLabel="Save"
          fields={[
            { name: "name", label: "Full name" },
            { name: "phone", label: "Phone" },
            { name: "email", label: "Email", type: "email" },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const res = await authFetch(`${API}/api/tenants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: v.name, phone: v.phone, email: v.email }),
            });
            if (!res.ok) {
              alert("Could not save the tenant");
              return;
            }
            const created = await res.json();
            setTenantList((all) => [...all, created]);
            closeModal();
          }}
        />
      )}
      {modal?.kind === "lease" && (
        <Modal
          title="Create lease"
          submitLabel="Create draft"
          fields={[
            { name: "unitId", label: "Unit", type: "select", options: unitOptions },
            { name: "tenantId", label: "Tenant", type: "select", options: tenantOptions },
            { name: "start", label: "Start date", type: "date" },
            { name: "end", label: "End date", type: "date" },
            { name: "rent", label: "Monthly rent", type: "number" },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const res = await authFetch(`${API}/api/leases`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                unitId: v.unitId,
                tenantId: v.tenantId,
                start: v.start,
                end: v.end,
                rent: Number(v.rent),
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not create the lease");
              return;
            }
            setLeaseList((all) => [...all, data]);
            closeModal();
          }}
        />
      )}
      {modal?.kind === "repair" && (
        <Modal
          title="Report repair"
          submitLabel="Save"
          fields={[
            { name: "unitId", label: "Unit", type: "select", options: unitOptions },
            { name: "title", label: "What is broken?" },
            {
              name: "priority",
              label: "Priority",
              type: "select",
              options: ["Low", "Medium", "High"].map((p) => ({ value: p, label: p })),
            },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const res = await authFetch(`${API}/api/repairs`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ unitId: v.unitId, title: v.title, priority: v.priority }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not report the repair");
              return;
            }
            setRepairList((all) => [...all, data]);
            closeModal();
          }}
        />
      )}
      {modal?.kind === "payment" && (
        <Modal
          title="Record payment"
          submitLabel="Save payment"
          fields={[{ name: "amount", label: "Amount received", type: "number" }]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const leaseId = modal.leaseId;
            const res = await authFetch(`${API}/api/payments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ leaseId, amount: Number(v.amount) }),
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "Could not save the payment");
              return;
            }
            setPayments((all) => [...all, data]);
            setMonthPayments((all) => [...all, data]);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    authFetch(`${API}/api/auth/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (!user) return <AuthScreen onAuthed={setUser} />;
  return (
    <Dashboard
      user={user}
      onLogout={() => {
        clearToken();
        setUser(null);
      }}
    />
  );
}
