import { PlanBlock, PlanFormData, WarningItem, OverflowItem } from "@/lib/types";
import { cardBase, inputBase, labelBase } from "@/lib/styles";
import { formatTime, formatWarningMessage } from "@/lib/utils";
import Timeline from "./Timeline";

type PlanPanelProps = {
  planForm: PlanFormData;
  setPlanForm: React.Dispatch<React.SetStateAction<PlanFormData>>;
  onGenerate: () => Promise<void>;
  blocks: PlanBlock[];
  warnings: WarningItem[];
  overflows: OverflowItem[];
  loading: boolean;
};

export default function PlanPanel({
  planForm,
  setPlanForm,
  onGenerate,
  blocks,
  warnings,
  overflows,
  loading,
}: PlanPanelProps) {
  return (
    <section className="space-y-6">
      <div className={`${cardBase} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              今日の計画
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              タスクと固定予定から、今日のタイムラインを自動生成します。
            </p>
          </div>
          <button
            onClick={onGenerate}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {loading ? "生成中..." : "計画を生成"}
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className={labelBase}>対象日</span>
            <input
              type="date"
              className={inputBase}
              value={planForm.date}
              onChange={(event) =>
                setPlanForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </label>
          <label className="space-y-2">
            <span className={labelBase}>タイムゾーン</span>
            <input className={inputBase} value={planForm.timezone} readOnly />
          </label>
          <div className="space-y-2 text-sm text-slate-600">
            <div className={labelBase}>稼働時間</div>
            <div>
              {planForm.working_hours
                .map(
                  (slot) =>
                    `${formatTime(slot.start)} - ${formatTime(slot.end)}`
                )
                .join(" / ")}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {planForm.working_hours.map((slot, index) => (
            <div key={`slot-${index}`} className="grid grid-cols-2 gap-2">
              <label className="space-y-2">
                <span className={labelBase}>開始 {index + 1}</span>
                <input
                  type="time"
                  className={inputBase}
                  value={slot.start}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      working_hours: prev.working_hours.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, start: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
              </label>
              <label className="space-y-2">
                <span className={labelBase}>終了 {index + 1}</span>
                <input
                  type="time"
                  className={inputBase}
                  value={slot.end}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      working_hours: prev.working_hours.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, end: event.target.value }
                          : item
                      ),
                    }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">注意</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning.message_id}>
                {formatWarningMessage(warning.message)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${cardBase} p-6`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">タイムライン</h2>
          <span className="text-sm text-slate-500">{planForm.date}</span>
        </div>
        <div className="mt-4">
          <Timeline blocks={blocks} />
        </div>
      </div>

      {overflows.length > 0 && (
        <div className={`${cardBase} p-6`}>
          <h2 className="text-lg font-semibold text-slate-900">
            今日中に入りきらないタスク
          </h2>
          <div className="mt-4 space-y-3">
            {overflows.map((overflow) => (
              <div
                key={overflow.task_id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="text-sm font-semibold text-slate-800">
                  {overflow.task_title}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {overflow.estimate_minutes}分 / 優先度 {overflow.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
