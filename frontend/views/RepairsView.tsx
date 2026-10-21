import { Badge, Header } from "../components/Parts";
import { btnGhost, btnPrimary } from "../lib/ui";
import type { Repair } from "../lib/types";

type Props = {
  repairs: Repair[];
  unitLabel: (id: string) => string;
  onReport: () => void;
  onNext: (repairId: string) => void;
};

export function RepairsView({ repairs, unitLabel, onReport, onNext }: Props) {
  return (
    <>
      <Header
        title="Repairs"
        subtitle="From first report to finished."
        action={<button className={btnPrimary} onClick={onReport}>Report repair</button>}
      />
      <div className="space-y-3">
        {repairs.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-stone-500">{unitLabel(r.unitId)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge text={r.priority} />
              <Badge text={r.status} />
              <button className={btnGhost} onClick={() => onNext(r.id)}>Next status</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
