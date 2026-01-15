export type Task = {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
};

export type EventItem = {
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
};

export type PlanListItem = {
  plan_id: string;
  date: string;
  timezone: string;
};

export type PlanBlock = {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
};

export type WarningItem = {
  message_id: string;
  message: string;
};

export type OverflowItem = {
  task_id: string;
  task_title: string;
  estimate_minutes: number;
  priority: number;
  reason: string;
};

export type TaskFormData = {
  title: string;
  description: string;
  type: string;
  priority: number;
  estimate_minutes: number;
};

export type EventFormData = {
  title: string;
  start_at: string;
  end_at: string;
  description: string;
};

export type PlanFormData = {
  date: string;
  timezone: string;
  working_hours: { start: string; end: string }[];
};
