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
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => task.status !== 'done');

  return (
    <Card>
      <SectionHeader
        title="タスク一覧"
        icon={
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
        }
        action={
          <ToggleSwitch
            checked={showCompleted}
            onChange={onToggleShowCompleted}
          />
        }
      />

      <div className="space-y-1">
        {filteredTasks.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">
            {showCompleted ? 'タスクがありません' : 'タスクがありません'}
          </p>
        )}

        {filteredTasks.map((task) => (
          <TaskItem
            key={task.task_id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

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
