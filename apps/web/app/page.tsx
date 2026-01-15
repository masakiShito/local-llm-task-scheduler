"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Task,
  EventItem,
  PlanListItem,
  PlanBlock,
  WarningItem,
  OverflowItem,
  TaskFormData,
  EventFormData,
  PlanFormData,
} from "@/lib/types";
import { fetchJson } from "@/lib/api";
import PlanPanel from "@/components/PlanPanel";
import TaskForm from "@/components/TaskList/TaskForm";
import TaskList from "@/components/TaskList";
import EventForm from "@/components/EventList/EventForm";
import EventList from "@/components/EventList";

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

  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: "",
    description: "",
    type: "task",
    priority: 3,
    estimate_minutes: 60,
  });
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: "",
    start_at: "",
    end_at: "",
    description: "",
  });
  const [planForm, setPlanForm] = useState<PlanFormData>({
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
