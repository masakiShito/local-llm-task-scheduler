import React from 'react';

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

// Helper function to convert time string to minutes from midnight
const timeToMinutes = (dateString: string): number => {
  const date = new Date(dateString);
  return date.getHours() * 60 + date.getMinutes();
};

// Helper function to calculate duration in minutes
const durationMinutes = (startAt: string, endAt: string): number => {
  return timeToMinutes(endAt) - timeToMinutes(startAt);
};

// Helper function to format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Helper function to format duration
const formatDuration = (startAt: string, endAt: string): string => {
  const minutes = durationMinutes(startAt, endAt);
  if (minutes < 60) {
    return `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${remainingMinutes}分`;
};

// Helper function to get kind label
const kindLabel = (kind: string): string => {
  switch (kind) {
    case 'work':
      return '作業';
    case 'break':
      return '休憩';
    case 'buffer':
      return '余り時間';
    default:
      return '予定';
  }
};

export const Timeline: React.FC<TimelineProps> = ({ blocks, tasks, date }) => {
  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        まだ計画がありません。右上の「計画を追加」でタイムラインが表示されます。
      </div>
    );
  }

  // Separate buffer blocks from active blocks
  const bufferBlocks = blocks.filter((block) => block.kind === "buffer");
  const activeBlocks = blocks.filter((block) => block.kind !== "buffer");
  const bufferMinutes = bufferBlocks.reduce((total, block) => {
    const minutes = durationMinutes(block.start_at, block.end_at);
    return total + minutes;
  }, 0);

  // Calculate timeline range
  const allTimes = blocks.map(b => [timeToMinutes(b.start_at), timeToMinutes(b.end_at)]).flat();
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const totalMinutes = maxTime - minTime;

  // Pixels per minute (adjustable for zoom)
  const pixelsPerMinute = 2;

  // Get overflow tasks (tasks that couldn't fit in the schedule)
  const scheduledTaskIds = new Set(blocks.map(b => b.task_id).filter(id => id !== null));
  const overflows = tasks.filter(t => t.status !== 'done' && !scheduledTaskIds.has(t.task_id));

  return (
    <div className="space-y-3">
      {/* Timeline header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-bold text-gray-900">タイムライン</h3>
        <span className="text-base text-gray-500">{date}</span>
      </div>

      {/* Timeline blocks - simple vertical layout */}
      {activeBlocks.map((block) => {
        const isBreak = block.kind === "break";
        const duration = durationMinutes(block.start_at, block.end_at);
        const height = Math.max(duration * pixelsPerMinute, 60); // Minimum 60px

        return (
          <div
            key={block.block_id}
            className={`rounded-2xl border px-4 py-3 shadow-sm ${
              isBreak
                ? "border-slate-200 bg-slate-50"
                : "border-slate-200 bg-white"
            }`}
            style={{
              minHeight: `${height}px`
            }}
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

      {/* Buffer time display */}
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
