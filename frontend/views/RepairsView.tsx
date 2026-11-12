import { Wrench } from "lucide-react";
import { Badge, EmptyState, Header } from "../components/Parts";
import { btnDanger, btnGhost, btnPrimary } from "../lib/ui";
import type { Repair } from "../lib/types";

type Props = {
  repairs: Repair[];
  unitLabel: (id: string) => string;
  onReport: () => void;
  onNext: (repairId: string) => void;
  onDelete: (repairId: string) => void;
};

export function RepairsView({ repairs, unitLabel, onReport, onNext, onDelete }: Props) {
  return (
    <>
      <Header
        title="Repairs"
        subtitle="From first report to finished."
        action={<button className={btnPrimary} onClick={onReport}>Report repair</button>}
      />
      {repairs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No repairs reported"
          text="When something breaks in a unit, report it here and track it until it's fixed."
          action={<button className={btnPrimary} onClick={onReport}>Report repair</button>}
        />
      ) : (
        <div className="space-y-3">
          {repairs.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Wrench size={18} />
                </span>
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-slate-500">{unitLabel(r.unitId)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge text={r.priority} />
                <Badge text={r.status} />
                <button className={btnGhost} onClick={() => onNext(r.id)}>Next status</button>
                <button className={btnDanger} onClick={() => onDelete(r.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}