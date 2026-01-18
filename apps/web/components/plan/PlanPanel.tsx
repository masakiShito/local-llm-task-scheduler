import React from "react";
import { Card } from "../common/Card";
import { SectionHeader } from "../common/SectionHeader";
import { Button } from "../common/Button";
import { Timeline } from "./Timeline";
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
  title: string;
  priority?: number | string;
}

interface FixedEvent {
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
  locked: boolean;
}

type WorkingHours = {
  amStart: string;
  amEnd: string;
  pmStart: string;
  pmEnd: string;
};

interface PlanPanelProps {
  date: string;
  workingHours: WorkingHours;
  onWorkingHoursChange: (updates: Partial<WorkingHours>) => void;
  blocks: PlanBlock[];
  tasks: Task[];
  events: FixedEvent[];
  onAddPlan: () => void;
  onAddEvent: () => void;
  isGenerating?: boolean;
}

export const PlanPanel: React.FC<PlanPanelProps> = ({
  date,
  workingHours,
  onWorkingHoursChange,
  blocks,
  tasks,
  events,
  onAddPlan,
  onAddEvent,
  isGenerating = false,
}) => {
  const formattedDate = formatJapaneseDate(date);
  const workingHoursDisplay = `${workingHours.amStart} - ${workingHours.amEnd} / ${workingHours.pmStart} - ${workingHours.pmEnd}`;

  return (
    <Card>
      <SectionHeader
        title="今日の計画"
        icon={
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onAddEvent}>
              + 固定予定
            </Button>
            <Button variant="primary" size="sm" onClick={onAddPlan} loading={isGenerating}>
              + 計画を追加
            </Button>
          </div>
        }
      />

      {/* Work date and hours */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="text-sm text-gray-500 mb-1">作業日</div>
          <div className="text-base font-medium text-gray-900">{formattedDate}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">時間割</div>
          <div className="text-sm font-medium text-gray-900">{workingHoursDisplay}</div>
          <div className="mt-2 grid gap-2 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[3rem] font-semibold text-gray-500">午前</span>
              <input
                type="time"
                value={workingHours.amStart}
                onChange={(event) => onWorkingHoursChange({ amStart: event.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="time"
                value={workingHours.amEnd}
                onChange={(event) => onWorkingHoursChange({ amEnd: event.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-[3rem] font-semibold text-gray-500">午後</span>
              <input
                type="time"
                value={workingHours.pmStart}
                onChange={(event) => onWorkingHoursChange({ pmStart: event.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="time"
                value={workingHours.pmEnd}
                onChange={(event) => onWorkingHoursChange({ pmEnd: event.target.value })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {blocks.length > 0 ? (
        <Timeline
          blocks={blocks}
          tasks={tasks}
          events={events}
          date={date}
          workingRanges={[
            { start: workingHours.amStart, end: workingHours.amEnd },
            { start: workingHours.pmStart, end: workingHours.pmEnd },
          ]}
        />
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-base font-medium mb-2">タイムラインがまだありません</p>
          <p className="text-gray-500 text-sm">
            右上の「+ 計画を追加」ボタンから計画を生成してください
          </p>
        </div>
      )}
    </Card>
  );
};
