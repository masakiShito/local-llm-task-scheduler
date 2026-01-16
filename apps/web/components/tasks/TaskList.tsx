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
  const incompleteTasks = tasks.filter((task) => task.status !== 'done');
  const completedTasks = tasks.filter((task) => task.status === 'done');

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

      {/* Incomplete tasks section */}
      <div>
        {incompleteTasks.length === 0 && completedTasks.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">
            タスクがありません
          </p>
        )}

        {incompleteTasks.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-2">
              未完了 ({incompleteTasks.length})
            </h3>
            <div className="space-y-1 border-l-2 border-indigo-200 pl-3">
              {incompleteTasks.map((task) => (
                <TaskItem
                  key={task.task_id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Completed tasks section */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            完了済み ({completedTasks.length})
          </h3>
          <div className="space-y-1 border-l-2 border-green-200 pl-3">
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
        className="mt-4 w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center justify-center gap-1 py-2"
      >
        <span className="text-lg">+</span>
        タスクを追加
      </button>
    </Card>
  );
};
