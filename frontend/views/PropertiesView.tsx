import { Header } from "../components/Parts";
import { units } from "../lib/data";
import { btnPrimary } from "../lib/ui";
import type { Lease, Property } from "../lib/types";

type Props = {
  properties: Property[];
  activeLeases: Lease[];
  onAdd: () => void;
};

export function PropertiesView({ properties, activeLeases, onAdd }: Props) {
  return (
    <>
      <Header
        title="Properties"
        subtitle="Buildings and the units inside them."
        action={<button className={btnPrimary} onClick={onAdd}>Add property</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => {
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
  );
}
