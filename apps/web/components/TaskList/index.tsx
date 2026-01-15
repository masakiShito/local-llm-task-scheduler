import { Task } from "@/lib/types";
import { cardBase } from "@/lib/styles";

type TaskListProps = {
  tasks: Task[];
};

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <div className={`${cardBase} p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">タスク一覧</h3>
        <span className="text-xs text-slate-500">{tasks.length}件</span>
      </div>
      <div className="mt-4 space-y-3">
        {tasks.length === 0 && (
          <p className="text-sm text-slate-500">
            まだタスクがありません。上のフォームから追加してください。
          </p>
        )}
        {tasks.map((task) => (
          <div
            key={task.task_id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="text-sm font-semibold text-slate-800">
              {task.title}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              優先度 {task.priority} / {task.estimate_minutes}分
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
