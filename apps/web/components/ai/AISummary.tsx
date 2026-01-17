import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';

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
  title: string;
  status: string;
  priority: number;
  estimate_minutes: number;
  due_at?: string;
}

interface AISummaryProps {
  blocks: PlanBlock[];
  tasks: Task[];
}

// Helper function to calculate duration in minutes
const durationMinutes = (startAt: string, endAt: string): number => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return (end.getTime() - start.getTime()) / (1000 * 60);
};

// Helper function to format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const AISummary: React.FC<AISummaryProps> = ({ blocks, tasks }) => {
  if (blocks.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <SectionHeader
          title="📊 計画サマリー"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <p className="text-sm text-gray-600 mt-2">
          計画を生成するとサマリーが表示されます。
        </p>
      </Card>
    );
  }

  // Calculate task status
  const workBlocks = blocks.filter(b => b.kind === 'work');
  const totalMinutes = workBlocks.reduce((sum, b) => {
    const duration = durationMinutes(b.start_at, b.end_at);
    return sum + duration;
  }, 0);

  const lastWorkBlock = workBlocks[workBlocks.length - 1];
  const endTime = lastWorkBlock ? formatTime(lastWorkBlock.end_at) : '';

  // Get overflow tasks (tasks that couldn't fit in the schedule)
  const scheduledTaskIds = new Set(blocks.map(b => b.task_id).filter(id => id !== null));
  const overflows = tasks.filter(t => t.status !== 'done' && !scheduledTaskIds.has(t.task_id));

  // Generate attention points
  const attentionPoints: string[] = [];

  // Check for long duration tasks (90+ minutes)
  workBlocks.forEach(b => {
    const duration = durationMinutes(b.start_at, b.end_at);
    if (duration >= 90 && b.task_title) {
      attentionPoints.push(`「${b.task_title}」は ${Math.round(duration)} 分の長時間作業です。適宜休憩を取ることをお勧めします。`);
    }
  });

  // Check for high priority overflow tasks
  if (overflows.length > 0) {
    const highPriorityOverflows = overflows.filter(t => t.priority >= 4);
    if (highPriorityOverflows.length > 0) {
      attentionPoints.push(`優先度の高いタスクが ${highPriorityOverflows.length} 件、時間内に収まりませんでした。明日以降の予定を調整してください。`);
    }
  }

  // Check for tasks with near deadlines
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nearDeadlineTasks = workBlocks
    .filter(b => {
      if (!b.task_id) return false;
      const task = tasks.find(t => t.task_id === b.task_id);
      if (!task?.due_at) return false;
      const dueDate = new Date(task.due_at);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() <= tomorrow.getTime();
    })
    .map(b => {
      const task = tasks.find(t => t.task_id === b.task_id);
      return task?.title || b.task_title;
    })
    .filter(Boolean);

  if (nearDeadlineTasks.length > 0) {
    attentionPoints.push(`締め切りが近いタスクが ${nearDeadlineTasks.length} 件あります。優先的に取り組みましょう。`);
  }

  // Default message if no attention points
  if (attentionPoints.length === 0) {
    attentionPoints.push('特に注意すべき点はありません。計画通りに進めましょう。');
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
      <SectionHeader
        title="📊 今日の計画サマリー"
        icon={
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />

      {/* Task Status */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">タスク状況</h4>
        <p className="text-sm text-slate-600 leading-relaxed">
          本日は {workBlocks.length} 件のタスクを割り当てました。総作業時間は {Math.round(totalMinutes)} 分で、{endTime} 頃に完了予定です。
          {overflows.length > 0 && ` ${overflows.length} 件のタスクが時間内に収まりませんでした。`}
        </p>
      </div>

      {/* Attention Points */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">⚠️ 注意点</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
          {attentionPoints.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      </div>

      {/* Overflow tasks detail (if any) */}
      {overflows.length > 0 && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">収まらなかったタスク</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            {overflows.slice(0, 5).map(task => (
              <li key={task.task_id} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{task.title} ({task.estimate_minutes}分)</span>
              </li>
            ))}
            {overflows.length > 5 && (
              <li className="text-blue-500 font-medium">...他 {overflows.length - 5} 件</li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
};
