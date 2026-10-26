"use client";

import { useEffect, useState } from "react";
import { Modal } from "../components/Parts";
import { units } from "../lib/data";
import { nav } from "../lib/ui";
import type { Lease, ModalState, Property, Payment, Repair, RepairStatus, Tenant, View } from "../lib/types";
import { LeasesView } from "../views/LeasesView";
import { OverviewView } from "../views/OverviewView";
import { PropertiesView } from "../views/PropertiesView";
import { RentView } from "../views/RentView";
import { RepairsView } from "../views/RepairsView";
import { TenantsView } from "../views/TenantsView";

const nextStatus: Record<RepairStatus, RepairStatus> = {
  Open: "In progress",
  "In progress": "Done",
  Done: "Open",
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  /* ---------- State: the data that can change ---------- */
  const [view, setView] = useState<View>("overview");
  const [modal, setModal] = useState<ModalState>(null);

  const [props, setProps] = useState<Property[]>([]);

  useEffect(() => {
    fetch(`${API}/api/properties`)
      .then((r) => r.json())
      .then((data) => setProps(data.properties))
      .catch(() => alert("Could not reach the server"));
  }, []);

  const [tenantList, setTenantList] = useState<Tenant[]>([]);

  useEffect(() => {
    fetch(`${API}/api/tenants`)
      .then((r) => r.json())
      .then((data) => setTenantList(data.tenants))
      .catch(() => alert("Could not reach the server"));
  }, []);

  const [leaseList, setLeaseList] = useState<Lease[]>([]);
  const [repairList, setRepairList] = useState<Repair[]>([]);

  useEffect(() => {
    fetch(`${API}/api/repairs`)
      .then((r) => r.json())
      .then((data) => setRepairList(data.repairs))
      .catch(() => alert("Could not reach the server"));
  }, []);

  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch(`${API}/api/payments`)
      .then((r) => r.json())
      .then((data) => setPayments(data.payments))
      .catch(() => alert("Could not reach the server"));
  }, []);

  useEffect(() => {
    fetch(`${API}/api/leases`)
      .then((r) => r.json())
      .then((data) => setLeaseList(data.leases))
      .catch(() => alert("Could not reach the server"));
  }, []);
  
  /* ---------- Helpers and totals computed from the state ---------- */
  const unitLabel = (id: string) => {
    const u = units.find((x) => x.id === id);
    const p = props.find((x) => x.id === u?.propertyId);
    return `${p?.name ?? ""} / ${u?.name ?? ""}`;
  };
  const tenantName = (id: string) => tenantList.find((t) => t.id === id)?.name ?? "—";
  const activeLeases = leaseList.filter((l) => l.status === "Active");
  const paid: Record<string, number> = {};
  for (const p of payments) paid[p.leaseId] = (paid[p.leaseId] ?? 0) + p.amount;
  const balance = (l: Lease) => l.rent - (paid[l.id] ?? 0);
  const rentState = (l: Lease) => (balance(l) <= 0 ? "Paid" : (paid[l.id] ?? 0) > 0 ? "Partial" : "Unpaid");

  const expected = activeLeases.reduce((s, l) => s + l.rent, 0);
  const collected = activeLeases.reduce((s, l) => s + (paid[l.id] ?? 0), 0);
  const occupiedUnits = new Set(activeLeases.map((l) => l.unitId)).size;
  const openRepairs = repairList.filter((r) => r.status !== "Done");
  const pct = expected ? Math.round((collected / expected) * 100) : 0;

  const unitOptions = units.map((u) => ({ value: u.id, label: unitLabel(u.id) }));
  const tenantOptions = tenantList.map((t) => ({ value: t.id, label: t.name }));
  const closeModal = () => setModal(null);

  const signLease = async (id: string) => {
    const res = await fetch(`${API}/api/leases/${id}/sign`, { method: "POST" });
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
    const res = await fetch(`${API}/api/repairs/${id}`, {
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
            />
          )}
          {view === "properties" && (
            <PropertiesView
              properties={props}
              activeLeases={activeLeases}
              onAdd={() => setModal({ kind: "property" })}
            />
          )}
          {view === "tenants" && (
            <TenantsView
              tenants={tenantList}
              activeLeases={activeLeases}
              unitLabel={unitLabel}
              onAdd={() => setModal({ kind: "tenant" })}
            />
          )}
          {view === "leases" && (
            <LeasesView
              leases={leaseList}
              tenantName={tenantName}
              unitLabel={unitLabel}
              onCreate={() => setModal({ kind: "lease" })}
              onSign={signLease}
            />
          )}
          {view === "rent" && (
            <RentView
              leases={activeLeases}
              expected={expected}
              collected={collected}
              paid={paid}
              tenantName={tenantName}
              unitLabel={unitLabel}
              balance={balance}
              rentState={rentState}
              onRecord={(leaseId) => setModal({ kind: "payment", leaseId })}
            />
          )}
          {view === "repairs" && (
            <RepairsView
              repairs={repairList}
              unitLabel={unitLabel}
              onReport={() => setModal({ kind: "repair" })}
              onNext={advanceRepair}
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
            const res = await fetch(`${API}/api/properties`, {
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
      {modal?.kind === "tenant" && (
        <Modal
          title="Add tenant"
          submitLabel="Save"
          fields={[
            { name: "name", label: "Full name" },
            { name: "phone", label: "Phone" },
            { name: "email", label: "Email", type: "text" },
          ]}
          onClose={closeModal}
          onSubmit={async (v) => {
            const res = await fetch(`${API}/api/tenants`, {
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
            const res = await fetch(`${API}/api/leases`, {
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
            const res = await fetch(`${API}/api/repairs`, {
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
            const res = await fetch(`${API}/api/payments`, {
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
            closeModal();
          }}
        />
      )}
    </div>
  );
}
