import { Badge, Header, Stat } from "../components/Parts";
import { units } from "../lib/data";
import { money } from "../lib/ui";
import type { Lease, Repair, View } from "../lib/types";

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
  goTo: (v: View) => void;
};

export function OverviewView({
  propertyCount, occupiedUnits, expected, collected, pct,
  openRepairs, unpaid, drafts, balance, tenantName, unitLabel, goTo,
}: Props) {
  return (
    <>
      <Header title="Overview" subtitle="Your whole portfolio at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Properties" value={String(propertyCount)} hint={`${units.length} units`} />
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
          {unpaid.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span>{tenantName(l.tenantId)} owes {money(balance(l))}</span>
              <button className="text-stone-500 underline" onClick={() => goTo("rent")}>Open rent</button>
            </li>
          ))}
          {openRepairs.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.title} ({unitLabel(r.unitId)})</span>
              <Badge text={r.priority} />
            </li>
          ))}
          {drafts.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span>Lease for {tenantName(l.tenantId)} is still a draft</span>
              <button className="text-stone-500 underline" onClick={() => goTo("leases")}>Open leases</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
