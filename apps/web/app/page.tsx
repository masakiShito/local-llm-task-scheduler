"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "http://localhost:8000";

type Task = {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
};

type EventItem = {
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
};

type PlanListItem = {
  plan_id: string;
  date: string;
  timezone: string;
};

type PlanBlock = {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
};

type WarningItem = {
  message_id: string;
  message: string;
};

type OverflowItem = {
  task_id: string;
  task_title: string;
  estimate_minutes: number;
  priority: number;
  reason: string;
};

const inputBase =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
const labelBase = "text-sm font-medium text-slate-700";
const cardBase = "rounded-2xl border border-slate-200 bg-white shadow-sm";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "API error");
  }
  return payload as T;
}

function formatTime(value: string) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  if (!value) return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function durationMinutes(start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return null;
  return Math.max(endMinutes - startMinutes, 0);
}

function formatDuration(start: string, end: string) {
  const minutes = durationMinutes(start, end);
  if (minutes === null) return "";
  return `${minutes}分`;
}

function formatWarningMessage(message: string) {
  const cleaned = message.replace(/W-\d+/g, "").trim();
  if (!cleaned) {
    return "説明文の生成に失敗しました。計画自体は作成できています。";
  }
  return cleaned;
}

function kindLabel(kind: string) {
  if (kind === "work") return "作業";
  if (kind === "break") return "休憩";
  if (kind === "buffer") return "調整時間";
  return "";
}

function Timeline({ blocks }: { blocks: PlanBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        まだ計画がありません。右上の「計画を生成」でタイムラインが表示されます。
      </div>
    );
  }

  const bufferBlocks = blocks.filter((block) => block.kind === "buffer");
  const activeBlocks = blocks.filter((block) => block.kind !== "buffer");
  const bufferMinutes = bufferBlocks.reduce((total, block) => {
    const minutes = durationMinutes(block.start_at, block.end_at) ?? 0;
    return total + minutes;
  }, 0);

  return (
    <div className="space-y-3">
      {activeBlocks.map((block) => {
        const isBreak = block.kind === "break";
        return (
          <div
            key={block.block_id}
            className={`rounded-2xl border px-4 py-3 shadow-sm ${
              isBreak
                ? "border-slate-200 bg-slate-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {block.task_title ?? "予定"}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {kindLabel(block.kind)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>
                {formatTime(block.start_at)} - {formatTime(block.end_at)}
              </span>
              <span className="text-xs text-slate-500">
                {formatDuration(block.start_at, block.end_at)}
              </span>
            </div>
          </div>
        );
      })}

      {bufferMinutes > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-800">
              余り時間 / 調整時間
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {bufferMinutes}分
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanPanel({
  planForm,
  setPlanForm,
  onGenerate,
  blocks,
  warnings,
  overflows,
  loading,
}: {
  planForm: {
    date: string;
    timezone: string;
    working_hours: { start: string; end: string }[];
  };
  setPlanForm: React.Dispatch<
    React.SetStateAction<{
      date: string;
      timezone: string;
      working_hours: { start: string; end: string }[];
    }>
  >;
  onGenerate: () => Promise<void>;
  blocks: PlanBlock[];
  warnings: WarningItem[];
  overflows: OverflowItem[];
  loading: boolean;
}) {
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

function TaskForm({
  taskForm,
  setTaskForm,
  onSubmit,
  loading,
}: {
  taskForm: {
    title: string;
    description: string;
    type: string;
    priority: number;
    estimate_minutes: number;
  };
  setTaskForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      type: string;
      priority: number;
      estimate_minutes: number;
    }>
  >;
  onSubmit: () => Promise<void>;
  loading: boolean;
}) {
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

function EventForm({
  eventForm,
  setEventForm,
  onSubmit,
  loading,
}: {
  eventForm: {
    title: string;
    start_at: string;
    end_at: string;
    description: string;
  };
  setEventForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      start_at: string;
      end_at: string;
      description: string;
    }>
  >;
  onSubmit: () => Promise<void>;
  loading: boolean;
}) {
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

function TaskList({ tasks }: { tasks: Task[] }) {
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

function EventList({ events }: { events: EventItem[] }) {
  return (
    <div className={`${cardBase} p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">固定予定一覧</h3>
        <span className="text-xs text-slate-500">{events.length}件</span>
      </div>
      <div className="mt-4 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-slate-500">
            まだ固定予定がありません。必要な予定を登録してください。
          </p>
        )}
        {events.map((event) => (
          <div
            key={event.event_id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="text-sm font-semibold text-slate-800">
              {event.title}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {formatTime(event.start_at)} - {formatTime(event.end_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [overflows, setOverflows] = useState<OverflowItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    type: "task",
    priority: 3,
    estimate_minutes: 60,
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    start_at: "",
    end_at: "",
    description: "",
  });
  const [planForm, setPlanForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    timezone: "Asia/Tokyo",
    working_hours: [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "18:00" },
    ],
  });

  const refreshTasks = useCallback(async () => {
    const payload = await fetchJson<{ data: Task[] }>("/tasks");
    setTasks(payload.data);
  }, []);

  const refreshEvents = useCallback(async () => {
    const payload = await fetchJson<{ data: EventItem[] }>(
      `/events?date=${planForm.date}`
    );
    setEvents(payload.data);
  }, [planForm.date]);

  const refreshPlans = useCallback(async () => {
    const payload = await fetchJson<{ data: PlanListItem[] }>("/plans");
    setPlans(payload.data);
  }, []);

  const loadLatestPlanBlocks = useCallback(async () => {
    if (plans.length === 0) {
      setBlocks([]);
      return;
    }
    const latest = plans[plans.length - 1];
    const payload = await fetchJson<{ data: PlanBlock[] }>(
      `/plans/${latest.plan_id}/blocks`
    );
    setBlocks(payload.data);
  }, [plans]);

  useEffect(() => {
    refreshTasks().catch((err) => setError(err.message));
    refreshEvents().catch((err) => setError(err.message));
    refreshPlans().catch((err) => setError(err.message));
  }, [refreshEvents, refreshPlans, refreshTasks]);

  useEffect(() => {
    loadLatestPlanBlocks().catch((err) => setError(err.message));
  }, [loadLatestPlanBlocks]);

  const handleCreateTask = async () => {
    setError(null);
    setLoadingTask(true);
    try {
      await fetchJson("/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm),
      });
      setTaskForm((prev) => ({ ...prev, title: "", description: "" }));
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "タスクの作成に失敗しました。");
    } finally {
      setLoadingTask(false);
    }
  };

  const handleCreateEvent = async () => {
    setError(null);
    setLoadingEvent(true);
    try {
      await fetchJson("/events", {
        method: "POST",
        body: JSON.stringify(eventForm),
      });

      // 作成した予定の日付を抽出
      const eventDate = eventForm.start_at.slice(0, 10);

      // その日付のイベント一覧を取得
      const payload = await fetchJson<{ data: EventItem[] }>(
        `/events?date=${eventDate}`
      );
      setEvents(payload.data);

      // planForm.date も更新（作成した予定の日付に切り替え）
      if (eventDate !== planForm.date) {
        setPlanForm(prev => ({ ...prev, date: eventDate }));
      }

      setEventForm({ title: "", start_at: "", end_at: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "予定の作成に失敗しました。");
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleGeneratePlan = async () => {
    setError(null);
    setLoadingPlan(true);
    try {
      const payload = await fetchJson<{
        data: {
          blocks: PlanBlock[];
          warnings: WarningItem[];
          overflow: OverflowItem[];
        };
      }>("/plans/generate", {
        method: "POST",
        body: JSON.stringify(planForm),
      });
      setBlocks(payload.data.blocks);
      setWarnings(payload.data.warnings);
      setOverflows(payload.data.overflow);
      await refreshPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "計画の生成に失敗しました。");
    } finally {
      setLoadingPlan(false);
    }
  };

  const hasErrors = useMemo(() => Boolean(error), [error]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
        {hasErrors && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div className="font-semibold">エラー</div>
            <div className="mt-1">{error}</div>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-5">
            <TaskForm
              taskForm={taskForm}
              setTaskForm={setTaskForm}
              onSubmit={handleCreateTask}
              loading={loadingTask}
            />
            <TaskList tasks={tasks} />
            <EventForm
              eventForm={eventForm}
              setEventForm={setEventForm}
              onSubmit={handleCreateEvent}
              loading={loadingEvent}
            />
            <EventList events={events} />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7">
            <PlanPanel
              planForm={planForm}
              setPlanForm={setPlanForm}
              onGenerate={handleGeneratePlan}
              blocks={blocks}
              warnings={warnings}
              overflows={overflows}
              loading={loadingPlan}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
