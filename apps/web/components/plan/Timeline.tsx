import React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import jaLocale from "@fullcalendar/core/locales/ja";

interface PlanBlock {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
  task_id: string | null;
}

interface Task {
  task_id: string;
  status: string;
  priority?: number;
}

interface TimelineProps {
  blocks: PlanBlock[];
  tasks: Task[];
  date: string;
}

// Helper function to get kind label
const kindLabel = (kind: string): string => {
  switch (kind) {
    case "work":
      return "作業";
    case "break":
      return "休憩";
    case "buffer":
      return "余り時間";
    default:
      return "予定";
  }
};

export const Timeline: React.FC<TimelineProps> = ({ blocks, tasks, date }) => {
  const workingRanges = [
    { start: "09:00", end: "12:00" },
    { start: "13:00", end: "18:00" },
  ];
  const timezoneOffset = "+09:00";

  const workingBackgroundEvents = workingRanges.map((range, index) => ({
    id: `working-${index}`,
    start: `${date}T${range.start}:00${timezoneOffset}`,
    end: `${date}T${range.end}:00${timezoneOffset}`,
    display: "background" as const,
    classNames: ["fc-working-hours"],
  }));

  const planEvents = blocks.map((block) => ({
    id: block.block_id,
    title: block.task_title ?? "予定",
    start: block.start_at,
    end: block.end_at,
    classNames: ["fc-plan-event", `fc-plan-${block.kind}`],
    extendedProps: {
      kind: block.kind,
    },
  }));

  const scheduledTaskIds = new Set(
    blocks.map((block) => block.task_id).filter((id): id is string => id !== null)
  );
  const overflows = tasks.filter(
    (task) => task.status !== "done" && !scheduledTaskIds.has(task.task_id)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">日別スケジュール</h3>
          <span className="text-base text-gray-500">{date}</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">GMT+09</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <FullCalendar
          plugins={[timeGridPlugin]}
          initialView="timeGridDay"
          initialDate={date}
          timeZone="Asia/Tokyo"
          locale="ja"
          locales={[jaLocale]}
          nowIndicator={true}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          headerToolbar={false}
          height="auto"
          expandRows={true}
          events={[...workingBackgroundEvents, ...planEvents]}
          eventContent={(eventInfo) => {
            const kind = eventInfo.event.extendedProps.kind as string | undefined;
            if (!kind) {
              return null;
            }
            return (
              <div className="flex h-full flex-col justify-center gap-1 px-2 py-1">
                <div className="text-xs font-semibold leading-tight">
                  {eventInfo.event.title}
                </div>
                <div className="text-[10px] font-medium opacity-80">
                  {kindLabel(kind)}
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Overflow tasks warning */}
      {overflows.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-orange-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-sm font-semibold text-orange-900 mb-1">
                時間内に収まらなかったタスク: {overflows.length}件
              </div>
              <ul className="text-xs text-orange-800 space-y-0.5">
                {overflows.slice(0, 3).map(task => (
                  <li key={task.task_id}>• {tasks.find(t => t.task_id === task.task_id)?.task_id}</li>
                ))}
                {overflows.length > 3 && (
                  <li className="text-orange-600">...他 {overflows.length - 3}件</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
