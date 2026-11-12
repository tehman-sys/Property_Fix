import { Building2, MapPin } from "lucide-react";
import { EmptyState, Header } from "../components/Parts";
import { btnDanger, btnGhost, btnPrimary } from "../lib/ui";
import type { Lease, Property, Unit } from "../lib/types";

type Props = {
  properties: Property[];
  units: Unit[];
  activeLeases: Lease[];
  onAdd: () => void;
  onAddUnit: (propertyId: string) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
};

export function PropertiesView({ properties, units, activeLeases, onAdd, onAddUnit, onEdit, onDelete }: Props) {
  return (
    <>
      <Header
        title="Properties"
        subtitle="Buildings and the units inside them."
        action={<button className={btnPrimary} onClick={onAdd}>Add property</button>}
      />
      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          text="Add your first building, then add the units inside it."
          action={<button className={btnPrimary} onClick={onAdd}>Add property</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const pu = units.filter((u) => u.propertyId === p.id);
            const occ = pu.filter((u) => activeLeases.some((l) => l.unitId === u.id)).length;
            const w = pu.length ? Math.round((occ / pu.length) * 100) : 0;
            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={20} />
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{p.type}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} /> {p.address}
                </p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{pu.length} {pu.length === 1 ? "unit" : "units"}</span>
                    <span>{occ} occupied</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${w}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button className={btnGhost} onClick={() => onAddUnit(p.id)}>Add unit</button>
                  <button className={btnGhost} onClick={() => onEdit(p)}>Edit</button>
                  <button className={`${btnDanger} ml-auto`} onClick={() => onDelete(p.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}