import { Header, Table } from "../components/Parts";
import { btnPrimary } from "../lib/ui";
import type { Lease, Tenant } from "../lib/types";

type Props = {
  tenants: Tenant[];
  activeLeases: Lease[];
  unitLabel: (id: string) => string;
  onAdd: () => void;
};

export function TenantsView({ tenants, activeLeases, unitLabel, onAdd }: Props) {
  return (
    <>
      <Header
        title="Tenants"
        subtitle="The people renting your units."
        action={<button className={btnPrimary} onClick={onAdd}>Add tenant</button>}
      />
      <Table head={["Name", "Phone", "Email", "Current unit"]}>
        {tenants.map((t) => {
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
  );
}
