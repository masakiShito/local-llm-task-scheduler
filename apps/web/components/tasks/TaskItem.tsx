import React from 'react';

interface Task {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isCompleted = task.status === 'done';

  // Calculate time display (e.g., "08:00")
  const hours = Math.floor(task.estimate_minutes / 60);
  const minutes = task.estimate_minutes % 60;
  const timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 py-2 group">
      <button
        onClick={() => onToggleComplete(task.task_id, !isCompleted)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1">
        <div className={`text-base ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">
          {timeDisplay}
        </div>
      </div>

      {/* Action buttons - shown on hover */}
      {(onEdit || onDelete) && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`「${task.title}」を削除しますか？`)) {
                  onDelete(task.task_id);
                }
              }}
              className="px-2 py-1 text-sm text-red-600 hover:text-red-900"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  );
};
