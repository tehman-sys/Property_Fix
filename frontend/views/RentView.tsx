import { Badge, Header, Stat, Table } from "../components/Parts";
import { btnGhost, money } from "../lib/ui";
import type { Lease } from "../lib/types";

type Props = {
  leases: Lease[]; // active leases only
  expected: number;
  collected: number;
  paid: Record<string, number>;
  tenantName: (id: string) => string;
  unitLabel: (id: string) => string;
  balance: (l: Lease) => number;
  rentState: (l: Lease) => string;
  onRecord: (leaseId: string) => void;
};

export function RentView({
  leases, expected, collected, paid, tenantName, unitLabel, balance, rentState, onRecord,
}: Props) {
  return (
    <>
      <Header title="Monthly rent" subtitle="Charges come from signed leases. Partial payments are allowed." />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Expected" value={money(expected)} />
        <Stat label="Collected" value={money(collected)} />
        <Stat label="Outstanding" value={money(expected - collected)} />
      </div>
      <Table head={["Tenant", "Unit", "Rent", "Paid", "Balance", "Status", ""]}>
        {leases.map((l) => (
          <tr key={l.id}>
            <td className="px-4 py-3 font-medium">{tenantName(l.tenantId)}</td>
            <td className="px-4 py-3">{unitLabel(l.unitId)}</td>
            <td className="px-4 py-3">{money(l.rent)}</td>
            <td className="px-4 py-3">{money(paid[l.id] ?? 0)}</td>
            <td className="px-4 py-3">{money(balance(l))}</td>
            <td className="px-4 py-3"><Badge text={rentState(l)} /></td>
            <td className="px-4 py-3 text-right">
              {balance(l) > 0 && (
                <button className={btnGhost} onClick={() => onRecord(l.id)}>Record payment</button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
