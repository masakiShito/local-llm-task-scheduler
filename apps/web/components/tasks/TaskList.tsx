import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { TaskItem } from './TaskItem';

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

interface TaskListProps {
  tasks: Task[];
  showCompleted: boolean;
  onToggleShowCompleted: (show: boolean) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  showCompleted,
  onToggleShowCompleted,
  onToggleComplete,
  onAdd,
  onEdit,
  onDelete,
}) => {
  // Separate tasks into categories
  const fixedTasks = tasks.filter((task) => task.status !== 'done' && task.is_fixed_time);
  const regularTasks = tasks.filter((task) => task.status !== 'done' && !task.is_fixed_time);
  const completedTasks = tasks.filter((task) => task.status === 'done');

  const hasAnyTasks = tasks.length > 0;

  return (
    <Card>
      <SectionHeader
        title="タスク一覧"
        icon={
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
        }
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">完了を表示</span>
            <ToggleSwitch
              checked={showCompleted}
              onChange={onToggleShowCompleted}
            />
          </div>
        }
      />

      {!hasAnyTasks && (
        <p className="text-sm text-gray-500 py-4 text-center">
          タスクがありません
        </p>
      )}

      {/* Fixed time tasks section */}
      {fixedTasks.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            📌 固定予定 ({fixedTasks.length})
          </h3>
          <div className="space-y-2 border-l-2 border-red-200 pl-3">
            {fixedTasks.map((task) => (
              <TaskItem
                key={task.task_id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular incomplete tasks section */}
      {regularTasks.length > 0 && (
        <div className={fixedTasks.length > 0 ? "mt-6 pt-4 border-t border-gray-200" : "mt-3"}>
          <h3 className="text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-1">
            ⚡ 未完了タスク ({regularTasks.length})
          </h3>
          <div className="space-y-2 border-l-2 border-indigo-200 pl-3">
            {regularTasks.map((task) => (
              <TaskItem
                key={task.task_id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks section */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
            ✅ 完了済み ({completedTasks.length})
          </h3>
          <div className="space-y-2 border-l-2 border-green-200 pl-3">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.task_id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAdd}
        className="mt-4 w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center justify-center gap-1 py-2 border-t border-gray-200 pt-4"
      >
        <span className="text-lg">+</span>
        タスクを追加
      </button>
    </Card>
  );
};
