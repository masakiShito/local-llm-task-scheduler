import React from 'react';

interface Task {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
  due_at?: string;
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

  // Calculate time display (e.g., "2h00m")
  const hours = Math.floor(task.estimate_minutes / 60);
  const minutes = task.estimate_minutes % 60;
  const timeDisplay = hours > 0
    ? `${hours}h${minutes.toString().padStart(2, '0')}m`
    : `${minutes}m`;

  // Format due date
  const formatDueDate = (dueAt?: string) => {
    if (!dueAt) return null;
    const date = new Date(dueAt);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Priority labels
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { text: '低', color: 'bg-blue-100 text-blue-700' };
      case 2: return { text: '中', color: 'bg-yellow-100 text-yellow-700' };
      case 3: return { text: '高', color: 'bg-red-100 text-red-700' };
      default: return { text: '中', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const dueDate = formatDueDate(task.due_at);
  const priorityInfo = getPriorityLabel(task.priority);

  return (
    <div className={`flex items-start gap-3 py-3 group transition-opacity ${
      isCompleted ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => onToggleComplete(task.task_id, !isCompleted)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
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

      <div className="flex-1 min-w-0">
        <div className={`text-base font-medium mb-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Due date badge */}
          {dueDate && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {dueDate}
            </span>
          )}
          {/* Priority badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityInfo.color}`}>
            優先度: {priorityInfo.text}
          </span>
          {/* Estimate badge */}
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* Action buttons - shown on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
        {!isCompleted ? (
          <>
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                編集
              </button>
            )}
            <button
              onClick={() => onToggleComplete(task.task_id, true)}
              className="px-3 py-1 text-sm text-white bg-green-500 hover:bg-green-600 rounded"
            >
              完了
            </button>
          </>
        ) : (
          <button
            onClick={() => onToggleComplete(task.task_id, false)}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 rounded"
          >
            再開
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (confirm(`「${task.title}」を削除しますか？`)) {
                onDelete(task.task_id);
              }
            }}
            className="px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded"
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
};
