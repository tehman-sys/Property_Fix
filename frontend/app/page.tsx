"use client";

import { useState } from "react";
import { Modal } from "../components/Parts";
import { leases, properties, repairs, tenants, units } from "../lib/data";
import { nav } from "../lib/ui";
import type { Lease, ModalState, Repair, RepairStatus, View } from "../lib/types";
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

export default function Home() {
  /* ---------- State: the data that can change ---------- */
  const [view, setView] = useState<View>("overview");
  const [modal, setModal] = useState<ModalState>(null);
  const [props, setProps] = useState(properties);
  const [tenantList, setTenantList] = useState(tenants);
  const [leaseList, setLeaseList] = useState(leases);
  const [repairList, setRepairList] = useState(repairs);
  const [paid, setPaid] = useState<Record<string, number>>({ l1: 65000, l2: 20000, l3: 0, l4: 125000 });

  /* ---------- Helpers and totals computed from the state ---------- */
  const unitLabel = (id: string) => {
    const u = units.find((x) => x.id === id);
    const p = props.find((x) => x.id === u?.propertyId);
    return `${p?.name ?? ""} / ${u?.name ?? ""}`;
  };
  const tenantName = (id: string) => tenantList.find((t) => t.id === id)?.name ?? "—";
  const activeLeases = leaseList.filter((l) => l.status === "Active");
  const balance = (l: Lease) => l.rent - (paid[l.id] ?? 0);
  const rentState = (l: Lease) => (balance(l) <= 0 ? "Paid" : (paid[l.id] ?? 0) > 0 ? "Partial" : "Unpaid");

  const expected = activeLeases.reduce((s, l) => s + l.rent, 0);
  const collected = activeLeases.reduce((s, l) => s + (paid[l.id] ?? 0), 0);
  const occupiedUnits = new Set(activeLeases.map((l) => l.unitId)).size;
  const openRepairs = repairList.filter((r) => r.status !== "Done");
  const pct = expected ? Math.round((collected / expected) * 100) : 0;

  const unitOptions = units.map((u) => ({ value: u.id, label: unitLabel(u.id) }));
  const tenantOptions = tenantList.map((t) => ({ value: t.id, label: t.name }));
  const newId = () => crypto.randomUUID();
  const closeModal = () => setModal(null);

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
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                view === n.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
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
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${
                view === n.id ? "bg-stone-900 text-white" : "text-stone-600"
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
              onSign={(id) =>
                setLeaseList((all) => all.map((x) => (x.id === id ? { ...x, status: "Active" } : x)))
              }
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
              onNext={(id) =>
                setRepairList((all) => all.map((x) => (x.id === id ? { ...x, status: nextStatus[x.status] } : x)))
              }
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
          onSubmit={(v) => {
            setProps((all) => [...all, { id: newId(), name: v.name, address: v.address, type: v.type }]);
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
          onSubmit={(v) => {
            setTenantList((all) => [...all, { id: newId(), name: v.name, phone: v.phone, email: v.email }]);
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
          onSubmit={(v) => {
            setLeaseList((all) => [
              ...all,
              { id: newId(), unitId: v.unitId, tenantId: v.tenantId, start: v.start, end: v.end, rent: Number(v.rent), status: "Draft" },
            ]);
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
          onSubmit={(v) => {
            setRepairList((all) => [
              ...all,
              { id: newId(), unitId: v.unitId, title: v.title, priority: v.priority as Repair["priority"], status: "Open" },
            ]);
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
          onSubmit={(v) => {
            const id = modal.leaseId;
            setPaid((p) => ({ ...p, [id]: (p[id] ?? 0) + Number(v.amount) }));
            closeModal();
          }}
        />
      )}
    </div>
  );
}
