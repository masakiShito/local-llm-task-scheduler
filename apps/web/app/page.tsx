"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TaskList } from "@/components/tasks/TaskList";
import { PlanPanel } from "@/components/plan/PlanPanel";
import { AISummary } from "@/components/ai/AISummary";
import { TaskModal, EventModal } from "@/components/modals";
import type { TaskFormData } from "@/components/modals";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "http://localhost:8000";

type Task = {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
  description?: string;
  type: string;
  due_at?: string;
  available_from?: string;
  available_to?: string;
  splittable: boolean;
  min_block_minutes?: number;
  // Fixed time task fields
  is_fixed_time: boolean;
  fixed_start_at?: string;
  fixed_end_at?: string;
};

type PlanBlock = {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
  task_id: string | null;
  meta?: {
    is_fixed_time?: boolean;
    [key: string]: any;
  };
};

type FixedEvent = {
  event_id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  locked: boolean;
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
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [events, setEvents] = useState<FixedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Plan state
  const [currentDate] = useState(new Date().toISOString().slice(0, 10));
  const [planGenerated, setPlanGenerated] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    amStart: "09:00",
    amEnd: "12:00",
    pmStart: "13:00",
    pmEnd: "18:00",
  });

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Fetch data functions
  const refreshTasks = useCallback(async () => {
    try {
      const payload = await fetchJson<{ data: Task[] }>("/tasks");
      setTasks(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
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
        setPlanGenerated(true);
      } else {
        setBlocks([]);
        setPlanGenerated(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    }
  }, []);

  const refreshEvents = useCallback(async (date: string) => {
    try {
      const eventsPayload = await fetchJson<{ data: FixedEvent[] }>(
        `/events?date=${date}`
      );
      setEvents(eventsPayload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
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
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    if (editingTask) {
      // Update existing task
      await fetchJson(`/tasks/${editingTask.task_id}`, {
        method: "PATCH",
        body: JSON.stringify(taskData),
      });
    } else {
      // Create new task
      await fetchJson("/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      });
    }
    await refreshTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetchJson(`/tasks/${taskId}`, { method: "DELETE" });
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleAddEvent = () => {
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData: {
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
  }) => {
    await fetchJson("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    await refreshEvents(currentDate);
  };

  // Plan handlers
  const handleAddPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const payload = await fetchJson<{ data: any }>("/plans/generate", {
        method: "POST",
        body: JSON.stringify({
          date: currentDate,
          timezone: "Asia/Tokyo",
          working_hours: [
            { start: workingHours.amStart, end: workingHours.amEnd },
            { start: workingHours.pmStart, end: workingHours.pmEnd },
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
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Initial data load
  useEffect(() => {
    refreshTasks();
    loadPlanForDate(currentDate);
    refreshEvents(currentDate);
  }, [refreshTasks, loadPlanForDate, refreshEvents, currentDate]);

  // Format working hours for display
  return (
    <DashboardLayout
      leftColumn={
        <TaskList
          tasks={tasks}
          showCompleted={showCompletedTasks}
          onToggleShowCompleted={setShowCompletedTasks}
          onToggleComplete={handleToggleTaskComplete}
          onAdd={handleAddTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      }
      centerColumn={
        <PlanPanel
          date={currentDate}
          workingHours={workingHours}
          onWorkingHoursChange={(updates) =>
            setWorkingHours((prev) => ({ ...prev, ...updates }))
          }
          blocks={blocks}
          tasks={tasks}
          events={events}
          onAddPlan={handleAddPlan}
          onAddEvent={handleAddEvent}
          isGenerating={isGeneratingPlan}
        />
      }
      rightColumn={
        <AISummary blocks={blocks} tasks={tasks} />
      }
    >
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        defaultDate={currentDate}
      />
    </DashboardLayout>
  );
}
