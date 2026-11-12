import { Badge, Header, Stat, Table } from "../components/Parts";
import { btnGhost, inputCls, money } from "../lib/ui";
import type { Lease } from "../lib/types";

type Props = {
  leases: Lease[]; // leases that cover the selected month
  month: string; // "2026-11"
  isCurrent: boolean; // payments can only be recorded for the current month
  paid: Record<string, number>; // leaseId -> amount paid in the selected month
  tenantName: (id: string) => string;
  unitLabel: (id: string) => string;
  onMonthChange: (m: string) => void;
  onRecord: (leaseId: string) => void;
};

export function RentView({
  leases, month, isCurrent, paid, tenantName, unitLabel, onMonthChange, onRecord,
}: Props) {
  const balance = (l: Lease) => l.rent - (paid[l.id] ?? 0);
  const state = (l: Lease) =>
    balance(l) <= 0 ? "Paid" : (paid[l.id] ?? 0) > 0 ? "Partial" : "Unpaid";
  const expected = leases.reduce((s, l) => s + l.rent, 0);
  const collected = leases.reduce((s, l) => s + (paid[l.id] ?? 0), 0);

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Tenant", "Unit", "Rent", "Paid", "Balance", "Status"],
      ...leases.map((l) => [
        tenantName(l.tenantId), unitLabel(l.unitId), l.rent, paid[l.id] ?? 0, balance(l), state(l),
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rent-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header
        title="Monthly rent"
        subtitle="Charges come from signed leases. Partial payments are allowed."
        action={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && onMonthChange(e.target.value)}
              className={`${inputCls} w-auto`}
            />
            <button className={btnGhost} onClick={exportCsv}>Export CSV</button>
          </div>
        }
      />
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
            <td className="px-4 py-3"><Badge text={state(l)} /></td>
            <td className="px-4 py-3 text-right">
              {isCurrent && balance(l) > 0 && l.status === "Active" && (
                <button className={btnGhost} onClick={() => onRecord(l.id)}>Record payment</button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}