import { Users } from "lucide-react";
import { EmptyState, Header, Table } from "../components/Parts";
import { btnDanger, btnGhost, btnPrimary } from "../lib/ui";
import type { Lease, Tenant } from "../lib/types";

type Props = {
  tenants: Tenant[];
  activeLeases: Lease[];
  unitLabel: (id: string) => string;
  onAdd: () => void;
  onEdit: (t: Tenant) => void;
  onDelete: (id: string) => void;
};

export function TenantsView({ tenants, activeLeases, unitLabel, onAdd, onEdit, onDelete }: Props) {
  return (
    <>
      <Header
        title="Tenants"
        subtitle="The people renting your units."
        action={<button className={btnPrimary} onClick={onAdd}>Add tenant</button>}
      />
      {tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants yet"
          text="Add the people who rent from you. You can link them to a unit with a lease."
          action={<button className={btnPrimary} onClick={onAdd}>Add tenant</button>}
        />
      ) : (
        <Table head={["Name", "Phone", "Email", "Current unit", "Actions"]}>
          {tenants.map((t) => {
            const l = activeLeases.find((x) => x.tenantId === t.id);
            return (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-medium text-indigo-700">
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{t.phone}</td>
                <td className="px-4 py-3 text-slate-500">{t.email}</td>
                <td className="px-4 py-3">{l ? unitLabel(l.unitId) : <span className="text-slate-400">None</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className={btnGhost} onClick={() => onEdit(t)}>Edit</button>
                    <button className={btnDanger} onClick={() => onDelete(t.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}