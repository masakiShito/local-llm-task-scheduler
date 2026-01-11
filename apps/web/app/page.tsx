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

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [overflows, setOverflows] = useState<OverflowItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    await fetchJson("/tasks", {
      method: "POST",
      body: JSON.stringify(taskForm),
    });
    setTaskForm((prev) => ({ ...prev, title: "", description: "" }));
    await refreshTasks();
  };

  const handleCreateEvent = async () => {
    setError(null);
    await fetchJson("/events", {
      method: "POST",
      body: JSON.stringify(eventForm),
    });
    setEventForm({ title: "", start_at: "", end_at: "", description: "" });
    await refreshEvents();
  };

  const handleGeneratePlan = async () => {
    setError(null);
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
  };

  const hasErrors = useMemo(() => Boolean(error), [error]);

  return (
    <main>
      <h1>Task Scheduler MVP</h1>
      <p className="muted">
        API Base: <strong>{apiBase}</strong>
      </p>
      {hasErrors && (
        <section style={{ border: "1px solid #fecaca", background: "#fff1f2" }}>
          <strong>エラー:</strong> {error}
        </section>
      )}

      <section>
        <h2>タスク登録</h2>
        <div className="grid">
          <label>
            タイトル
            <input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
          <label>
            種別
            <select
              value={taskForm.type}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, type: event.target.value }))
              }
            >
              <option value="task">task</option>
              <option value="todo">todo</option>
            </select>
          </label>
          <label>
            優先度
            <input
              type="number"
              min={1}
              max={5}
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  priority: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            想定工数 (分)
            <input
              type="number"
              min={5}
              max={1440}
              value={taskForm.estimate_minutes}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  estimate_minutes: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            説明
            <textarea
              value={taskForm.description}
              rows={2}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <button onClick={handleCreateTask} disabled={!taskForm.title}>
          タスク作成
        </button>
        <div className="list">
          {tasks.map((task) => (
            <div key={task.task_id} className="card">
              <strong>{task.title}</strong>
              <div className="muted">
                優先度 {task.priority} / {task.estimate_minutes} 分
              </div>
              <span className="pill">{task.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>固定予定登録</h2>
        <div className="grid">
          <label>
            タイトル
            <input
              value={eventForm.title}
              onChange={(event) =>
                setEventForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>
          <label>
            開始
            <input
              type="datetime-local"
              value={eventForm.start_at}
              onChange={(event) =>
                setEventForm((prev) => ({
                  ...prev,
                  start_at: event.target.value,
                }))
              }
            />
          </label>
          <label>
            終了
            <input
              type="datetime-local"
              value={eventForm.end_at}
              onChange={(event) =>
                setEventForm((prev) => ({
                  ...prev,
                  end_at: event.target.value,
                }))
              }
            />
          </label>
          <label>
            メモ
            <textarea
              value={eventForm.description}
              rows={2}
              onChange={(event) =>
                setEventForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <button onClick={handleCreateEvent} disabled={!eventForm.title}>
          予定作成
        </button>
        <div className="list">
          {events.map((event) => (
            <div key={event.event_id} className="card">
              <strong>{event.title}</strong>
              <div className="muted">
                {event.start_at} - {event.end_at}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>計画生成</h2>
        <div className="grid">
          <label>
            対象日
            <input
              type="date"
              value={planForm.date}
              onChange={(event) =>
                setPlanForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </label>
          <label>
            タイムゾーン
            <input value={planForm.timezone} readOnly />
          </label>
          <label>
            作業時間 1
            <input
              value={planForm.working_hours[0].start}
              onChange={(event) =>
                setPlanForm((prev) => ({
                  ...prev,
                  working_hours: [
                    { ...prev.working_hours[0], start: event.target.value },
                    prev.working_hours[1],
                  ],
                }))
              }
            />
          </label>
          <label>
            作業時間 1 (終了)
            <input
              value={planForm.working_hours[0].end}
              onChange={(event) =>
                setPlanForm((prev) => ({
                  ...prev,
                  working_hours: [
                    { ...prev.working_hours[0], end: event.target.value },
                    prev.working_hours[1],
                  ],
                }))
              }
            />
          </label>
          <label>
            作業時間 2
            <input
              value={planForm.working_hours[1].start}
              onChange={(event) =>
                setPlanForm((prev) => ({
                  ...prev,
                  working_hours: [
                    prev.working_hours[0],
                    { ...prev.working_hours[1], start: event.target.value },
                  ],
                }))
              }
            />
          </label>
          <label>
            作業時間 2 (終了)
            <input
              value={planForm.working_hours[1].end}
              onChange={(event) =>
                setPlanForm((prev) => ({
                  ...prev,
                  working_hours: [
                    prev.working_hours[0],
                    { ...prev.working_hours[1], end: event.target.value },
                  ],
                }))
              }
            />
          </label>
        </div>
        <button onClick={handleGeneratePlan}>計画生成</button>
        <div className="list">
          {warnings.map((warning) => (
            <div key={warning.message_id} className="card">
              <strong>Warning {warning.message_id}</strong>
              <div className="muted">{warning.message}</div>
            </div>
          ))}
          {overflows.map((overflow) => (
            <div key={overflow.task_id} className="card">
              <strong>Overflow: {overflow.task_title}</strong>
              <div className="muted">
                {overflow.estimate_minutes} 分 / 優先度 {overflow.priority}
              </div>
            </div>
          ))}
          {blocks.map((block) => (
            <div key={block.block_id} className="card">
              <span className="pill">{block.kind}</span>
              <strong>{block.task_title ?? "休憩/バッファ"}</strong>
              <div className="muted">
                {block.start_at} - {block.end_at}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
