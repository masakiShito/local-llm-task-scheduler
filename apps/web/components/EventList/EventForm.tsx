import { EventFormData } from "@/lib/types";
import { cardBase, inputBase, labelBase } from "@/lib/styles";

type EventFormProps = {
  eventForm: EventFormData;
  setEventForm: React.Dispatch<React.SetStateAction<EventFormData>>;
  onSubmit: () => Promise<void>;
  loading: boolean;
};

export default function EventForm({
  eventForm,
  setEventForm,
  onSubmit,
  loading,
}: EventFormProps) {
  return (
    <div className={`${cardBase} p-6`}>
      <h2 className="text-xl font-semibold text-slate-900">固定予定</h2>
      <p className="mt-2 text-sm text-slate-600">
        会議や外出など動かせない予定を登録します。
      </p>
      <div className="mt-4 grid gap-4">
        <label className="space-y-2">
          <span className={labelBase}>タイトル</span>
          <input
            value={eventForm.title}
            className={inputBase}
            placeholder="例: 定例ミーティング"
            onChange={(event) =>
              setEventForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className={labelBase}>開始</span>
            <input
              type="datetime-local"
              className={inputBase}
              value={eventForm.start_at}
              onChange={(event) =>
                setEventForm((prev) => ({
                  ...prev,
                  start_at: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2">
            <span className={labelBase}>終了</span>
            <input
              type="datetime-local"
              className={inputBase}
              value={eventForm.end_at}
              onChange={(event) =>
                setEventForm((prev) => ({
                  ...prev,
                  end_at: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className={labelBase}>メモ</span>
          <textarea
            value={eventForm.description}
            rows={2}
            className={inputBase}
            placeholder="補足があれば入力してください"
            onChange={(event) =>
              setEventForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <button
        onClick={onSubmit}
        disabled={!eventForm.title || loading}
        className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "追加中..." : "予定を追加"}
      </button>
    </div>
  );
}
