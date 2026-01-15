import React from 'react';
import { TimelineBlock } from './TimelineBlock';

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
}

interface TimelineProps {
  blocks: PlanBlock[];
  tasks: Task[];
  date: string;
}

export const Timeline: React.FC<TimelineProps> = ({ blocks, tasks, date }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:00`;
  };

  // Get unique hours from blocks
  const getTimeSlots = () => {
    const hours = new Set<number>();
    blocks.forEach((block) => {
      const startHour = new Date(block.start_at).getHours();
      const endHour = new Date(block.end_at).getHours();
      for (let h = startHour; h <= endHour; h++) {
        hours.add(h);
      }
    });
    return Array.from(hours).sort((a, b) => a - b);
  };

  const timeSlots = getTimeSlots();

  // Check if a task is completed
  const isTaskCompleted = (taskId: string | null) => {
    if (!taskId) return false;
    const task = tasks.find((t) => t.task_id === taskId);
    return task?.status === 'done';
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-base font-bold text-gray-900">タイムライン</h3>
        <span className="text-sm text-gray-500">{date}</span>
      </div>

      <div className="relative">
        {/* Time markers */}
        <div className="absolute left-0 top-0 bottom-0 w-16 space-y-12">
          {timeSlots.map((hour) => (
            <div key={hour} className="text-sm text-gray-500">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Timeline blocks */}
        <div className="ml-20">
          {blocks.map((block) => (
            <TimelineBlock
              key={block.block_id}
              block={block}
              isCompleted={isTaskCompleted(block.task_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
