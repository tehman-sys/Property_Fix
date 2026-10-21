"use client";

import { useState } from "react";
import type { Field, Lease, ModalState, Repair, RepairStatus, View } from "../lib/types";
import { leases, properties, tenants, units, repairs } from "../lib/data";
import { money, nav, btnPrimary, btnGhost } from "../lib/ui";
import { Badge, Stat, Header, Table, Modal } from "../components/Parts";

/* ---------- The page ---------- */
export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [modal, setModal] = useState<ModalState>(null);
  const [props, setProps] = useState(properties);
  const [tenantList, setTenantList] = useState(tenants);
  const [leaseList, setLeaseList] = useState(leases);
  const [repairList, setRepairList] = useState(repairs);
  const [paid, setPaid] = useState<Record<string, number>>({ l1: 65000, l2: 20000, l3: 0, l4: 125000 });

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
  const nextStatus: Record<RepairStatus, RepairStatus> = { Open: "In progress", "In progress": "Done", Done: "Open" };

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

        <main className="mx-auto max-w-5xl p-6 md:p-10">
          {/* OVERVIEW */}
          {view === "overview" && (
            <>
              <Header title="Overview" subtitle="Your whole portfolio at a glance." />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Properties" value={String(props.length)} hint={`${units.length} units`} />
                <Stat label="Occupied" value={`${occupiedUnits}/${units.length}`} hint="units with active lease" />
                <Stat label="Rent this month" value={money(expected)} hint={`${money(collected)} collected`} />
                <Stat label="Open repairs" value={String(openRepairs.length)} hint="need action" />
              </div>

              <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">Rent collection</span>
                  <span className="text-stone-500">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100">
                  <div className="h-2 rounded-full bg-stone-900" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-stone-500">{money(expected - collected)} still outstanding</p>
              </div>

              <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
                <p className="mb-3 text-sm font-medium">Needs attention</p>
                <ul className="space-y-2 text-sm">
                  {activeLeases.filter((l) => balance(l) > 0).map((l) => (
                    <li key={l.id} className="flex justify-between">
                      <span>{tenantName(l.tenantId)} owes {money(balance(l))}</span>
                      <button className="text-stone-500 underline" onClick={() => setView("rent")}>Open rent</button>
                    </li>
                  ))}
                  {openRepairs.map((r) => (
                    <li key={r.id} className="flex justify-between">
                      <span>{r.title} ({unitLabel(r.unitId)})</span>
                      <Badge text={r.priority} />
                    </li>
                  ))}
                  {leaseList.filter((l) => l.status === "Draft").map((l) => (
                    <li key={l.id} className="flex justify-between">
                      <span>Lease for {tenantName(l.tenantId)} is still a draft</span>
                      <button className="text-stone-500 underline" onClick={() => setView("leases")}>Open leases</button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* PROPERTIES */}
          {view === "properties" && (
            <>
              <Header
                title="Properties"
                subtitle="Buildings and the units inside them."
                action={<button className={btnPrimary} onClick={() => setModal({ kind: "property" })}>Add property</button>}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {props.map((p) => {
                  const pu = units.filter((u) => u.propertyId === p.id);
                  const occ = pu.filter((u) => activeLeases.some((l) => l.unitId === u.id)).length;
                  return (
                    <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-5">
                      <p className="text-xs uppercase tracking-wide text-stone-500">{p.type}</p>
                      <h3 className="mt-1 text-lg font-semibold">{p.name}</h3>
                      <p className="text-sm text-stone-500">{p.address}</p>
                      <div className="mt-4 flex justify-between text-sm">
                        <span>{pu.length} units</span>
                        <span className="text-stone-500">{occ} occupied</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TENANTS */}
          {view === "tenants" && (
            <>
              <Header
                title="Tenants"
                subtitle="The people renting your units."
                action={<button className={btnPrimary} onClick={() => setModal({ kind: "tenant" })}>Add tenant</button>}
              />
              <Table head={["Name", "Phone", "Email", "Current unit"]}>
                {tenantList.map((t) => {
                  const l = activeLeases.find((x) => x.tenantId === t.id);
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3">{t.phone}</td>
                      <td className="px-4 py-3 text-stone-500">{t.email}</td>
                      <td className="px-4 py-3">{l ? unitLabel(l.unitId) : <span className="text-stone-400">None</span>}</td>
                    </tr>
                  );
                })}
              </Table>
            </>
          )}

          {/* LEASES */}
          {view === "leases" && (
            <>
              <Header
                title="Leases"
                subtitle="A lease links one tenant to one unit."
                action={<button className={btnPrimary} onClick={() => setModal({ kind: "lease" })}>Create lease</button>}
              />
              <Table head={["Tenant", "Unit", "Rent / month", "Period", "Status", ""]}>
                {leaseList.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 font-medium">{tenantName(l.tenantId)}</td>
                    <td className="px-4 py-3">{unitLabel(l.unitId)}</td>
                    <td className="px-4 py-3">{money(l.rent)}</td>
                    <td className="px-4 py-3 text-stone-500">{l.start} to {l.end}</td>
                    <td className="px-4 py-3"><Badge text={l.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {l.status === "Draft" && (
                        <button
                          className={btnGhost}
                          onClick={() => setLeaseList((all) => all.map((x) => (x.id === l.id ? { ...x, status: "Active" } : x)))}
                        >
                          Mark signed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}

          {/* RENT */}
          {view === "rent" && (
            <>
              <Header title="Monthly rent" subtitle="Charges come from signed leases. Partial payments are allowed." />
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <Stat label="Expected" value={money(expected)} />
                <Stat label="Collected" value={money(collected)} />
                <Stat label="Outstanding" value={money(expected - collected)} />
              </div>
              <Table head={["Tenant", "Unit", "Rent", "Paid", "Balance", "Status", ""]}>
                {activeLeases.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 font-medium">{tenantName(l.tenantId)}</td>
                    <td className="px-4 py-3">{unitLabel(l.unitId)}</td>
                    <td className="px-4 py-3">{money(l.rent)}</td>
                    <td className="px-4 py-3">{money(paid[l.id] ?? 0)}</td>
                    <td className="px-4 py-3">{money(balance(l))}</td>
                    <td className="px-4 py-3"><Badge text={rentState(l)} /></td>
                    <td className="px-4 py-3 text-right">
                      {balance(l) > 0 && (
                        <button className={btnGhost} onClick={() => setModal({ kind: "payment", leaseId: l.id })}>
                          Record payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}

          {/* REPAIRS */}
          {view === "repairs" && (
            <>
              <Header
                title="Repairs"
                subtitle="From first report to finished."
                action={<button className={btnPrimary} onClick={() => setModal({ kind: "repair" })}>Report repair</button>}
              />
              <div className="space-y-3">
                {repairList.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4">
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-sm text-stone-500">{unitLabel(r.unitId)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge text={r.priority} />
                      <Badge text={r.status} />
                      <button
                        className={btnGhost}
                        onClick={() =>
                          setRepairList((all) => all.map((x) => (x.id === r.id ? { ...x, status: nextStatus[x.status] } : x)))
                        }
                      >
                        Next status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {modal?.kind === "property" && (
        <Modal
          title="Add property"
          submitLabel="Save"
          fields={[
            { name: "name", label: "Name" },
            { name: "address", label: "Address" },
            { name: "type", label: "Type (e.g. Apartments)" },
          ]}
          onClose={() => setModal(null)}
          onSubmit={(v) => {
            setProps((all) => [...all, { id: newId(), name: v.name, address: v.address, type: v.type }]);
            setModal(null);
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
          onClose={() => setModal(null)}
          onSubmit={(v) => {
            setTenantList((all) => [...all, { id: newId(), name: v.name, phone: v.phone, email: v.email }]);
            setModal(null);
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
          onClose={() => setModal(null)}
          onSubmit={(v) => {
            setLeaseList((all) => [
              ...all,
              { id: newId(), unitId: v.unitId, tenantId: v.tenantId, start: v.start, end: v.end, rent: Number(v.rent), status: "Draft" },
            ]);
            setModal(null);
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
          onClose={() => setModal(null)}
          onSubmit={(v) => {
            setRepairList((all) => [
              ...all,
              { id: newId(), unitId: v.unitId, title: v.title, priority: v.priority as Repair["priority"], status: "Open" },
            ]);
            setModal(null);
          }}
        />
      )}
      {modal?.kind === "payment" && (
        <Modal
          title="Record payment"
          submitLabel="Save payment"
          fields={[{ name: "amount", label: "Amount received", type: "number" }]}
          onClose={() => setModal(null)}
          onSubmit={(v) => {
            const id = modal.leaseId;
            setPaid((p) => ({ ...p, [id]: (p[id] ?? 0) + Number(v.amount) }));
            setModal(null);
          }}
        />
      )}
    </div>
  );
}