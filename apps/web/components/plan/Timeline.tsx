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

  // Fixed time slots from 7:00 to 22:00
  const getTimeSlots = () => {
    const hours: number[] = [];
    for (let h = 7; h <= 22; h++) {
      hours.push(h);
    }
    return hours;
  };

  const timeSlots = getTimeSlots();

  // Check if a task is completed
  const isTaskCompleted = (taskId: string | null) => {
    if (!taskId) return false;
    const task = tasks.find((t) => t.task_id === taskId);
    return task?.status === 'done';
  };

  // Group blocks by hour for better organization
  const getBlocksForHour = (hour: number) => {
    return blocks.filter((block) => {
      const startHour = new Date(block.start_at).getHours();
      return startHour === hour;
    });
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-bold text-gray-900">タイムライン</h3>
        <span className="text-base text-gray-500">{date}</span>
      </div>

      <div className="space-y-1">
        {timeSlots.map((hour) => {
          const hourBlocks = getBlocksForHour(hour);
          return (
            <div key={hour} className="flex gap-4 min-h-[60px] items-start">
              {/* Time marker */}
              <div className="w-16 flex-shrink-0 pt-1">
                <div className="text-base text-gray-600 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              </div>

              {/* Block area */}
              <div className="flex-1">
                {hourBlocks.length > 0 ? (
                  hourBlocks.map((block) => (
                    <TimelineBlock
                      key={block.block_id}
                      block={block}
                      isCompleted={isTaskCompleted(block.task_id)}
                    />
                  ))
                ) : (
                  <div className="h-[60px] border-l-2 border-gray-200 pl-3 flex items-center text-gray-400 text-sm">
                    -
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
