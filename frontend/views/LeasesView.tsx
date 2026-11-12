import { Badge, Header, Table } from "../components/Parts";
import { btnDanger, btnGhost, btnPrimary, money } from "../lib/ui";
import type { Lease } from "../lib/types";

type Props = {
  leases: Lease[];
  tenantName: (id: string) => string;
  unitLabel: (id: string) => string;
  onCreate: () => void;
  onSign: (leaseId: string) => void;
  onEdit: (l: Lease) => void;
  onDelete: (leaseId: string) => void;
};

export function LeasesView({ leases, tenantName, unitLabel, onCreate, onSign, onEdit, onDelete }: Props) {
  return (
    <>
      <Header
        title="Leases"
        subtitle="A lease links one tenant to one unit."
        action={<button className={btnPrimary} onClick={onCreate}>Create lease</button>}
      />
      <Table head={["Tenant", "Unit", "Rent / month", "Period", "Status", ""]}>
        {leases.map((l) => (
          <tr key={l.id}>
            <td className="px-4 py-3 font-medium">{tenantName(l.tenantId)}</td>
            <td className="px-4 py-3">{unitLabel(l.unitId)}</td>
            <td className="px-4 py-3">{money(l.rent)}</td>
            <td className="px-4 py-3 text-stone-500">{l.start} to {l.end}</td>
            <td className="px-4 py-3"><Badge text={l.status} /></td>
            <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-2">
                {l.status === "Draft" && (
                  <button className={btnGhost} onClick={() => onSign(l.id)}>Mark signed</button>
                )}
                {l.status !== "Expired" && (
                  <button className={btnGhost} onClick={() => onEdit(l)}>Edit</button>
                )}
                <button className={btnDanger} onClick={() => onDelete(l.id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}