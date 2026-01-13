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

function priorityLabel(priority: number) {
  if (priority >= 4) return "高";
  if (priority >= 2) return "中";
  return "低";
}

function priorityColor(priority: number) {
  if (priority >= 4) return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
  if (priority >= 2) return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" };
  return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" };
}

function Timeline({ blocks, events }: { blocks: PlanBlock[]; events: EventItem[] }) {
  if (blocks.length === 0 && events.length === 0) {
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

  // 固定予定とブロックをマージして時間順にソート
  type TimelineItem =
    | { type: 'block'; data: PlanBlock }
    | { type: 'event'; data: EventItem };

  const timelineItems: TimelineItem[] = [
    ...activeBlocks.map((block) => ({ type: 'block' as const, data: block })),
    ...events.map((event) => ({ type: 'event' as const, data: event })),
  ];

  timelineItems.sort((a, b) => {
    const timeA = timeToMinutes(a.type === 'block' ? a.data.start_at : a.data.start_at) ?? 0;
    const timeB = timeToMinutes(b.type === 'block' ? b.data.start_at : b.data.start_at) ?? 0;
    return timeA - timeB;
  });

  return (
    <div className="space-y-3">
      {timelineItems.map((item) => {
        if (item.type === 'event') {
          const event = item.data;
          return (
            <div
              key={event.event_id}
              className="rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-blue-900">
                  📅 {event.title}
                </div>
                <span className="rounded-full bg-blue-200 px-3 py-1 text-xs font-medium text-blue-800">
                  固定予定
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-blue-700">
                <span>
                  {formatTime(event.start_at)} - {formatTime(event.end_at)}
                </span>
                <span className="text-xs text-blue-600">
                  {formatDuration(event.start_at, event.end_at)}
                </span>
              </div>
            </div>
          );
        } else {
          const block = item.data;
          const isBreak = block.kind === "break";
          return (
            <div
              key={block.block_id}
              className={`rounded-2xl border px-4 py-3 shadow-sm ${
                isBreak
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50"
                  : "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`text-sm font-semibold ${isBreak ? "text-amber-900" : "text-emerald-900"}`}>
                  {isBreak ? "☕ " : "✓ "}
                  {block.task_title ?? "予定"}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isBreak
                    ? "bg-amber-200 text-amber-800"
                    : "bg-emerald-200 text-emerald-800"
                }`}>
                  {kindLabel(block.kind)}
                </span>
              </div>
              <div className={`mt-2 flex flex-wrap items-center gap-3 text-sm ${isBreak ? "text-amber-700" : "text-emerald-700"}`}>
                <span>
                  {formatTime(block.start_at)} - {formatTime(block.end_at)}
                </span>
                <span className={`text-xs ${isBreak ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatDuration(block.start_at, block.end_at)}
                </span>
              </div>
            </div>
          );
        }
      })}

      {bufferMinutes > 0 && (
        <div className="rounded-2xl border border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-purple-900">
              ⏱️ 余り時間 / 調整時間
            </div>
            <span className="rounded-full bg-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
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
  events,
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
  events: EventItem[];
  warnings: WarningItem[];
  overflows: OverflowItem[];
  loading: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className={`${cardBase} bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              📋 今日の計画
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              タスクと固定予定から、今日のタイムラインを自動生成します。
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
          >
            {loading ? "🔄 生成中..." : "✨ 計画を生成"}
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

      <div className={`${cardBase} bg-gradient-to-br from-white to-slate-50 p-6`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            🕐 タイムライン
          </h2>
          <span className="rounded-full bg-slate-200 px-4 py-1 text-sm font-semibold text-slate-700">
            {planForm.date}
          </span>
        </div>
        <div className="mt-4">
          <Timeline blocks={blocks} events={events} />
        </div>
      </div>

      {overflows.length > 0 && (
        <div className={`${cardBase} bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 p-6`}>
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
            ⚠️ 今日中に入りきらないタスク
          </h2>
          <div className="mt-4 space-y-3">
            {overflows.map((overflow) => {
              const colors = priorityColor(overflow.priority);
              return (
                <div
                  key={overflow.task_id}
                  className={`rounded-xl border ${colors.border} bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-sm`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {overflow.task_title}
                    </div>
                    <span className={`rounded-full ${colors.bg} ${colors.text} px-3 py-1 text-xs font-bold`}>
                      {priorityLabel(overflow.priority)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    ⏱️ {overflow.estimate_minutes}分
                  </div>
                </div>
              );
            })}
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
    <div className={`${cardBase} bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6`}>
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
        ✅ タスク追加
      </h2>
      <p className="mt-2 text-sm text-slate-700">
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
            <select
              className={inputBase}
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  priority: Number(event.target.value),
                }))
              }
            >
              <option value={5}>高</option>
              <option value={3}>中</option>
              <option value={1}>低</option>
            </select>
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
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 transform hover:scale-[1.02] transition-all"
      >
        {loading ? "⏳ 追加中..." : "➕ タスクを追加"}
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
    <div className={`${cardBase} bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6`}>
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
        📅 固定予定
      </h2>
      <p className="mt-2 text-sm text-slate-700">
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
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transform hover:scale-[1.02] transition-all"
      >
        {loading ? "⏳ 追加中..." : "➕ 予定を追加"}
      </button>
    </div>
  );
}

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className={`${cardBase} bg-gradient-to-br from-white to-green-50 p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
          📝 タスク一覧
        </h3>
        <span className="rounded-full bg-green-200 px-3 py-1 text-xs font-bold text-green-800">
          {tasks.length}件
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {tasks.length === 0 && (
          <p className="text-sm text-slate-500">
            まだタスクがありません。上のフォームから追加してください。
          </p>
        )}
        {tasks.map((task) => {
          const colors = priorityColor(task.priority);
          return (
            <div
              key={task.task_id}
              className={`rounded-xl border ${colors.border} bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-sm`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  {task.title}
                </div>
                <span className={`rounded-full ${colors.bg} ${colors.text} px-3 py-1 text-xs font-bold`}>
                  {priorityLabel(task.priority)}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                ⏱️ {task.estimate_minutes}分
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventList({ events }: { events: EventItem[] }) {
  return (
    <div className={`${cardBase} bg-gradient-to-br from-white to-blue-50 p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          📆 固定予定一覧
        </h3>
        <span className="rounded-full bg-blue-200 px-3 py-1 text-xs font-bold text-blue-800">
          {events.length}件
        </span>
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
            className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 shadow-sm"
          >
            <div className="text-sm font-semibold text-blue-900">
              📅 {event.title}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
              <span>🕐 {formatTime(event.start_at)} - {formatTime(event.end_at)}</span>
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
      setEventForm({ title: "", start_at: "", end_at: "", description: "" });
      await refreshEvents();
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
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
              events={events}
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
