"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TaskList } from "@/components/tasks/TaskList";
import { ScheduleSection } from "@/components/schedule/ScheduleSection";
import { PlanPanel } from "@/components/plan/PlanPanel";
import { AISummary } from "@/components/ai/AISummary";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "http://localhost:8000";

type Task = {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
  description?: string;
  type?: string;
  due_at?: string;
};

type EventItem = {
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
  description?: string;
};

type RecurringSchedule = {
  recurring_schedule_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
};

type PlanBlock = {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
  task_id: string | null;
};

type LlmSummaryOverflowPlan = {
  taskTitle: string;
  suggestions: string[];
};

type LlmSummary = {
  summary: string;
  why_this_order: string[];
  warnings: string[];
  overflow_plan: LlmSummaryOverflowPlan[];
};

async function fetchJson<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(apiBase + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export default function Home() {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>([]);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [llmSummary, setLlmSummary] = useState<LlmSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showFixedSchedules, setShowFixedSchedules] = useState(false);
  const [showRecurringSchedules, setShowRecurringSchedules] = useState(false);

  // Plan state
  const [currentDate] = useState(new Date().toISOString().slice(0, 10));
  const [planGenerated, setPlanGenerated] = useState(false);

  // Fetch data functions
  const refreshTasks = useCallback(async () => {
    try {
      const payload = await fetchJson<{ data: Task[] }>("/tasks");
      setTasks(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      const payload = await fetchJson<{ data: EventItem[] }>(
        `/events?date=${currentDate}`
      );
      setEvents(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    }
  }, [currentDate]);

  const refreshRecurringSchedules = useCallback(async () => {
    try {
      const payload = await fetchJson<{ data: RecurringSchedule[] }>(
        "/recurring-schedules"
      );
      setRecurringSchedules(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schedules");
    }
  }, []);

  const loadPlanForDate = useCallback(async (date: string) => {
    try {
      const plansPayload = await fetchJson<{ data: any[] }>(
        `/plans?date_from=${date}&date_to=${date}`
      );

      if (plansPayload.data.length > 0) {
        const plan = plansPayload.data[0];
        const blocksPayload = await fetchJson<{ data: PlanBlock[] }>(
          `/plans/${plan.plan_id}/blocks`
        );
        setBlocks(blocksPayload.data);

        // Get plan details for LLM summary
        const planDetails = await fetchJson<{ data: any }>(
          `/plans/${plan.plan_id}`
        );
        setLlmSummary(planDetails.data.summary || null);
        setPlanGenerated(true);
      } else {
        setBlocks([]);
        setLlmSummary(null);
        setPlanGenerated(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    }
  }, []);

  // Task handlers
  const handleToggleTaskComplete = useCallback(async (taskId: string, completed: boolean) => {
    try {
      if (completed) {
        await fetchJson(`/tasks/${taskId}/complete`, { method: "POST" });
      } else {
        await fetchJson(`/tasks/${taskId}/reopen`, { method: "POST" });
      }
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  }, [refreshTasks]);

  const handleAddTask = () => {
    // TODO: Open task creation modal
    alert("Task creation modal - to be implemented");
  };

  const handleEditTask = (task: Task) => {
    // TODO: Open task edit modal
    alert(`Edit task: ${task.title} - to be implemented`);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetchJson(`/tasks/${taskId}`, { method: "DELETE" });
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  // Plan handlers
  const handleAddPlan = async () => {
    try {
      const payload = await fetchJson<{ data: any }>("/plans/generate", {
        method: "POST",
        body: JSON.stringify({
          date: currentDate,
          timezone: "Asia/Tokyo",
          working_hours: [
            { start: "09:00", end: "12:00" },
            { start: "13:00", end: "18:00" },
          ],
          constraints: {
            break_minutes: 10,
            focus_max_minutes: 90,
            buffer_ratio: 0.0,
          },
        }),
      });

      await loadPlanForDate(currentDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    }
  };

  // Initial data load
  useEffect(() => {
    refreshTasks();
    refreshEvents();
    refreshRecurringSchedules();
    loadPlanForDate(currentDate);
  }, [refreshTasks, refreshEvents, refreshRecurringSchedules, loadPlanForDate, currentDate]);

  // Format working hours for display
  const formatWorkingHours = () => {
    return "09:00 - 12:00 / 13:00 - 18:00";
  };

  // Render fixed schedules content
  const renderFixedSchedulesContent = () => {
    if (events.length === 0) {
      return <p className="text-xs text-gray-500">固定予定がありません</p>;
    }
    return (
      <div className="space-y-1">
        {events.map((event) => (
          <div key={event.event_id} className="text-xs text-gray-700">
            {event.title}
          </div>
        ))}
      </div>
    );
  };

  // Render recurring schedules content
  const renderRecurringSchedulesContent = () => {
    if (recurringSchedules.length === 0) {
      return <p className="text-xs text-gray-500">繰り返し予定がありません</p>;
    }
    return (
      <div className="space-y-1">
        {recurringSchedules.map((schedule) => (
          <div key={schedule.recurring_schedule_id} className="text-xs text-gray-700">
            {schedule.title}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout
      leftColumn={
        <>
          <TaskList
            tasks={tasks}
            showCompleted={showCompletedTasks}
            onToggleShowCompleted={setShowCompletedTasks}
            onToggleComplete={handleToggleTaskComplete}
            onAdd={handleAddTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
          <ScheduleSection
            showFixedSchedules={showFixedSchedules}
            onToggleShowFixedSchedules={setShowFixedSchedules}
            fixedSchedulesContent={renderFixedSchedulesContent()}
            showRecurringSchedules={showRecurringSchedules}
            onToggleShowRecurringSchedules={setShowRecurringSchedules}
            recurringSchedulesContent={renderRecurringSchedulesContent()}
          />
        </>
      }
      centerColumn={
        <PlanPanel
          date={currentDate}
          workingHours={formatWorkingHours()}
          blocks={blocks}
          tasks={tasks}
          onAddPlan={handleAddPlan}
        />
      }
      rightColumn={
        <AISummary summary={llmSummary} />
      }
    />
  );
}
