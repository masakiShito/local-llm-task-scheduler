import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import jaLocale from "@fullcalendar/core/locales/ja";
import { mapPriorityToClass, mapPriorityToLabel } from "@/utils/priority";
import { formatJapaneseDate } from "@/utils/datetime";

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
  priority?: number | string;
  title: string;
}

interface FixedEvent {
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
  locked: boolean;
}

interface TimelineProps {
  blocks: PlanBlock[];
  tasks: Task[];
  events: FixedEvent[];
  date: string;
  workingRanges: { start: string; end: string }[];
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

const formatTime = (dateString: string): string => {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(new Date(dateString));
};

const formatDuration = (startAt: string, endAt: string): string => {
  const diffMs = new Date(endAt).getTime() - new Date(startAt).getTime();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (totalMinutes < 60) {
    return `${totalMinutes}分`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${minutes}分`;
};

const formatDurationFromDates = (
  start?: Date | null,
  end?: Date | null
): string => {
  if (!start || !end) return "";
  const totalMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );
  return `${totalMinutes}分`;
};

const formatTimeFromDate = (date?: Date | null): string => {
  if (!date) return "";
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date);
};

const priorityBadgeClass = (label: string): string => {
  switch (label) {
    case "高":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    case "中":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "低":
    default:
      return "bg-sky-100 text-sky-700 border border-sky-200";
  }
};

export const Timeline: React.FC<TimelineProps> = ({
  blocks,
  tasks,
  events,
  date,
  workingRanges,
}) => {
  const [localBlocks, setLocalBlocks] = useState<PlanBlock[]>(blocks);
  const nowLabelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const updateNowLabel = () => {
      const label = nowLabelRef.current;
      if (!label) return;
      label.textContent = formatter.format(new Date());

      const line = document.querySelector<HTMLElement>(
        ".plan-calendar .fc-timegrid-now-indicator-line"
      );
      const container = label.parentElement;
      if (line && container) {
        const lineRect = line.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = lineRect.top - containerRect.top;
        label.style.top = `${Math.max(0, offset)}px`;
        label.style.opacity = "1";
      } else {
        label.style.opacity = "0";
      }
    };

    updateNowLabel();
    const intervalId = window.setInterval(updateNowLabel, 1000);
    window.addEventListener("resize", updateNowLabel);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", updateNowLabel);
    };
  }, []);

  const timezoneOffset = "+09:00";
  const formattedDate = formatJapaneseDate(date);

  const workingBackgroundEvents = workingRanges.map((range, index) => ({
    id: `working-${index}`,
    start: `${date}T${range.start}:00${timezoneOffset}`,
    end: `${date}T${range.end}:00${timezoneOffset}`,
    display: "background" as const,
    classNames: ["fc-working-hours"],
  }));

  const taskById = useMemo(() => {
    return new Map(tasks.map((task) => [task.task_id, task]));
  }, [tasks]);

  const planEvents = localBlocks.map((block) => {
    const task = block.task_id ? taskById.get(block.task_id) : undefined;
    const isWork = block.kind === "work";
    const isBreak = block.kind === "break";
    const isBuffer = block.kind === "buffer";
    const priorityLabel =
      isWork && task ? mapPriorityToLabel(task.priority) : undefined;
    const priorityClass =
      isWork && priorityLabel ? mapPriorityToClass(priorityLabel) : "";
    const kindClass = isBreak
      ? "plan-break"
      : isBuffer
      ? "plan-buffer"
      : "plan-work";
    return {
      id: block.block_id,
      title: isBreak
        ? "休憩"
        : isBuffer
        ? "余り時間"
        : block.task_title ?? "予定",
      start: block.start_at,
      end: block.end_at,
      classNames: ["fc-plan-event", kindClass, priorityClass].filter(Boolean),
      extendedProps: {
        kind: block.kind,
        priorityLabel,
        eventType: "plan",
      },
      editable: isWork,
      startEditable: isWork,
      durationEditable: isWork,
    };
  });

  const fixedEvents = events.map((event) => ({
    id: `fixed-${event.event_id}`,
    title: event.title,
    start: event.start_at,
    end: event.end_at,
    classNames: ["fc-fixed-event", "plan-fixed"],
    extendedProps: {
      eventType: "fixed",
    },
    editable: false,
  }));

  const scheduledTaskIds = new Set(
    localBlocks
      .map((block) => block.task_id)
      .filter((id): id is string => id !== null)
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
          <h3 className="text-base font-bold text-gray-900">
            日別スケジュール
          </h3>
          <span className="text-base text-gray-500">{formattedDate}</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">GMT+09</span>
      </div>

      <div className="plan-calendar relative rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
        <div
          ref={nowLabelRef}
          className="plan-now-label pointer-events-none absolute right-3 z-20 text-[11px] font-semibold text-red-600"
          aria-hidden="true"
        />
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          initialDate={date}
          timeZone="Asia/Tokyo"
          locale="ja"
          locales={[jaLocale]}
          nowIndicator={true}
          allDaySlot={false}
          editable={true}
          eventResizableFromStart={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          headerToolbar={false}
          height="auto"
          expandRows={true}
          slotDuration="00:05:00"
          slotLabelInterval="01:00"
          eventMinHeight={22}
          eventShortHeight={22}
          eventOverlap={false}
          slotEventOverlap={false}
          events={[...workingBackgroundEvents, ...fixedEvents, ...planEvents]}
          eventDrop={(changeInfo) => {
            if (!changeInfo.event.startStr || !changeInfo.event.endStr) return;
            if (changeInfo.event.extendedProps.eventType !== "plan") return;
            setLocalBlocks((prev) =>
              prev.map((block) =>
                block.block_id === changeInfo.event.id
                  ? {
                      ...block,
                      start_at: changeInfo.event.startStr,
                      end_at: changeInfo.event.endStr,
                    }
                  : block
              )
            );
          }}
          eventResize={(resizeInfo) => {
            if (!resizeInfo.event.startStr || !resizeInfo.event.endStr) return;
            if (resizeInfo.event.extendedProps.eventType !== "plan") return;
            setLocalBlocks((prev) =>
              prev.map((block) =>
                block.block_id === resizeInfo.event.id
                  ? {
                      ...block,
                      start_at: resizeInfo.event.startStr,
                      end_at: resizeInfo.event.endStr,
                    }
                  : block
              )
            );
          }}
          eventContent={(eventInfo) => {
            const kind = eventInfo.event.extendedProps.kind as
              | string
              | undefined;
            const priorityLabel = eventInfo.event.extendedProps
              .priorityLabel as string | undefined;
            const eventType = eventInfo.event.extendedProps.eventType as
              | string
              | undefined;
            if (!eventType) {
              return null;
            }
            const timeRange = `${formatTimeFromDate(
              eventInfo.event.start
            )}-${formatTimeFromDate(eventInfo.event.end)}`;
            const duration = formatDurationFromDates(
              eventInfo.event.start,
              eventInfo.event.end
            );
            const totalMinutes = Math.max(
              0,
              Math.round(
                ((eventInfo.event.end?.getTime() || 0) -
                  (eventInfo.event.start?.getTime() || 0)) /
                  60000
              )
            );
            const showTag = eventType === "fixed";
            const showDetails = !(kind === "break" || kind === "buffer");
            const showMeta = totalMinutes >= 15 && showDetails;
            return (
              <div className="flex h-full flex-col gap-0.5 px-1.5 py-0.5 leading-tight">
                <div className="text-[10px] font-semibold">
                  {timeRange} ({duration})
                </div>
                <div className="text-[11px] font-semibold">
                  {eventInfo.event.title}
                </div>
                {showMeta && (
                  <div className="flex flex-wrap items-center gap-1 text-[9px] font-semibold">
                    {priorityLabel && (
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5">
                        優先度 {priorityLabel}
                      </span>
                    )}
                    {kind && (
                      <span className="opacity-90">{kindLabel(kind)}</span>
                    )}
                    {showTag && (
                      <span className="rounded-full bg-white/50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700">
                        固定予定
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="mb-3 text-sm font-semibold text-slate-800">
          スケジュール一覧
        </div>
        <div className="space-y-2">
          {[...localBlocks]
            .sort(
              (a, b) =>
                new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
            )
            .map((block) => {
              const task = block.task_id
                ? taskById.get(block.task_id)
                : undefined;
              const priorityLabel = task
                ? mapPriorityToLabel(task.priority)
                : undefined;
              const startAt = formatTime(block.start_at);
              const endAt = formatTime(block.end_at);
              const duration = formatDuration(block.start_at, block.end_at);
              return (
                <div
                  key={block.block_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {block.task_title ?? "予定"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {kindLabel(block.kind)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      {startAt} - {endAt}
                    </div>
                    <div className="text-xs text-slate-500">{duration}</div>
                  </div>
                  {priorityLabel && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${priorityBadgeClass(
                        priorityLabel
                      )}`}
                    >
                      優先度 {priorityLabel}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Overflow tasks warning */}
      {overflows.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-orange-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <div className="text-sm font-semibold text-orange-900 mb-1">
                時間内に収まらなかったタスク: {overflows.length}件
              </div>
              <ul className="text-xs text-orange-800 space-y-0.5">
                {overflows.slice(0, 3).map((task) => (
                  <li key={task.task_id}>
                    •{" "}
                    {tasks.find((t) => t.task_id === task.task_id)?.title ??
                      task.task_id}
                    <span className="text-orange-700">（空き時間不足）</span>
                  </li>
                ))}
                {overflows.length > 3 && (
                  <li className="text-orange-600">
                    ...他 {overflows.length - 3}件
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
