import { Building2, CheckCircle2, FileSignature, Home, Wallet, Wrench } from "lucide-react";
import { Badge, EmptyState, Header, Stat } from "../components/Parts";
import { btnPrimary, money } from "../lib/ui";
import type { Lease, Property, Repair, Unit, View } from "../lib/types";

type Props = {
  propertyCount: number;
  occupiedUnits: number;
  expected: number;
  collected: number;
  pct: number;
  openRepairs: Repair[];
  unpaid: Lease[];
  drafts: Lease[];
  balance: (l: Lease) => number;
  tenantName: (id: string) => string;
  unitLabel: (id: string) => string;
  units: Unit[];
  properties: Property[];
  activeLeases: Lease[];
  goTo: (v: View) => void;
};

const linkBtn = "text-sm font-medium text-indigo-600 hover:underline";

export function OverviewView({
  propertyCount, occupiedUnits, expected, collected, pct, openRepairs, unpaid, drafts,
  balance, tenantName, unitLabel, units, properties, activeLeases, goTo,
}: Props) {
  const nothingPending = unpaid.length + openRepairs.length + drafts.length === 0;
  const occPct = units.length ? Math.round((occupiedUnits / units.length) * 100) : 0;

  return (
    <>
      <Header title="Overview" subtitle="Your whole portfolio at a glance." />

      {propertyCount === 0 ? (
        <EmptyState
          icon={Building2}
          title="Welcome to PropertyFix"
          text="Start by adding your first property. Then add its units, tenants and leases."
          action={<button className={btnPrimary} onClick={() => goTo("properties")}>Add your first property</button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Properties" value={String(propertyCount)} hint={`${units.length} units`} icon={Building2} tint="indigo" />
            <Stat label="Occupied" value={`${occupiedUnits}/${units.length}`} hint={`${occPct}% of units have an active lease`} icon={Home} tint="emerald" />
            <Stat label="Rent this month" value={money(expected)} hint={`${money(collected)} collected`} icon={Wallet} tint="amber" />
            <Stat label="Open repairs" value={String(openRepairs.length)} hint="need action" icon={Wrench} tint="rose" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium">Rent collection</p>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {money(collected)} of {money(expected)} collected. {money(expected - collected)} still outstanding.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 font-medium">Needs attention</p>
                {nothingPending ? (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 size={16} className="text-emerald-600" /> All clear. Nothing needs your attention.
                  </p>
                ) : (
                  <ul className="space-y-3 text-sm">
                    {unpaid.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <Wallet size={16} className="text-amber-600" />
                          {tenantName(l.tenantId)} owes {money(balance(l))}
                        </span>
                        <button className={linkBtn} onClick={() => goTo("rent")}>Open rent</button>
                      </li>
                    ))}
                    {openRepairs.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <Wrench size={16} className="text-rose-600" />
                          {r.title} ({unitLabel(r.unitId)})
                        </span>
                        <Badge text={r.priority} />
                      </li>
                    ))}
                    {drafts.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <FileSignature size={16} className="text-indigo-600" />
                          Lease for {tenantName(l.tenantId)} is still a draft
                        </span>
                        <button className={linkBtn} onClick={() => goTo("leases")}>Open leases</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 font-medium">Occupancy by property</p>
              <ul className="space-y-4">
                {properties.map((p) => {
                  const pu = units.filter((u) => u.propertyId === p.id);
                  const occ = pu.filter((u) => activeLeases.some((l) => l.unitId === u.id)).length;
                  const w = pu.length ? Math.round((occ / pu.length) * 100) : 0;
                  return (
                    <li key={p.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-slate-500">{occ}/{pu.length}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${w}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}