import { TaskFormData } from "@/lib/types";
import { cardBase, inputBase, labelBase } from "@/lib/styles";

type TaskFormProps = {
  taskForm: TaskFormData;
  setTaskForm: React.Dispatch<React.SetStateAction<TaskFormData>>;
  onSubmit: () => Promise<void>;
  loading: boolean;
};

export default function TaskForm({
  taskForm,
  setTaskForm,
  onSubmit,
  loading,
}: TaskFormProps) {
  return (
    <div className={`${cardBase} p-6`}>
      <h2 className="text-xl font-semibold text-slate-900">タスク追加</h2>
      <p className="mt-2 text-sm text-slate-600">
        まずは今日取り組みたいタスクを追加しましょう。
      </p>
      <div className="mt-4 grid gap-4">
        <label className="space-y-2">
          <span className={labelBase}>タイトル</span>
          <input
            value={taskForm.title}
            className={inputBase}
            placeholder="例: レポート作成"
            onChange={(event) =>
              setTaskForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className={labelBase}>優先度</span>
            <input
              type="number"
              min={1}
              max={5}
              className={inputBase}
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  priority: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="space-y-2">
            <span className={labelBase}>想定工数 (分)</span>
            <input
              type="number"
              min={5}
              max={1440}
              className={inputBase}
              value={taskForm.estimate_minutes}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  estimate_minutes: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className={labelBase}>説明</span>
          <textarea
            value={taskForm.description}
            rows={2}
            className={inputBase}
            placeholder="補足があれば入力してください"
            onChange={(event) =>
              setTaskForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <button
        onClick={onSubmit}
        disabled={!taskForm.title || loading}
        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "追加中..." : "タスクを追加"}
      </button>
    </div>
  );
}
