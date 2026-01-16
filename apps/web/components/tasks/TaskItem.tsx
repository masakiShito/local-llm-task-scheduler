import React from 'react';

interface Task {
  task_id: string;
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
  due_at?: string;
  is_fixed_time: boolean;
  fixed_start_at?: string;
  fixed_end_at?: string;
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

  // Format date time
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Format time only (for fixed time tasks)
  const formatTimeOnly = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Priority labels
  const getPriorityStars = (priority: number) => {
    const stars = '★'.repeat(priority) + '☆'.repeat(5 - priority);
    return stars;
  };

  const dueDate = formatDateTime(task.due_at);

  return (
    <div className={`flex items-start gap-3 py-3 group transition-opacity rounded-lg hover:bg-gray-50 px-2 ${
      isCompleted ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => onToggleComplete(task.task_id, !isCompleted)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 border-green-500'
            : task.is_fixed_time
            ? 'border-red-400 hover:border-red-500'
            : 'border-indigo-300 hover:border-indigo-400'
        }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className={`text-base font-medium mb-2 flex-1 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.is_fixed_time && <span className="mr-1">🔒</span>}
            {task.title}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Fixed time display */}
          {task.is_fixed_time && task.fixed_start_at && task.fixed_end_at && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeOnly(task.fixed_start_at)} - {formatTimeOnly(task.fixed_end_at)}
            </span>
          )}

          {/* Regular task: due date badge */}
          {!task.is_fixed_time && dueDate && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              期限: {dueDate}
            </span>
          )}

          {/* Regular task: priority badge */}
          {!task.is_fixed_time && (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              task.priority >= 4 ? 'bg-red-100 text-red-800' :
              task.priority === 3 ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getPriorityStars(task.priority)}
            </span>
          )}

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
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-300"
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
