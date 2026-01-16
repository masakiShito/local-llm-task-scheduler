import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';
import { Timeline } from './Timeline';

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

interface PlanPanelProps {
  date: string;
  workingHours: string;
  blocks: PlanBlock[];
  tasks: Task[];
  onAddPlan: () => void;
  isGenerating?: boolean;
}

export const PlanPanel: React.FC<PlanPanelProps> = ({
  date,
  workingHours,
  blocks,
  tasks,
  onAddPlan,
  isGenerating = false,
}) => {
  return (
    <Card>
      <SectionHeader
        title="今日の計画"
        icon={
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        }
        action={
          <Button variant="primary" size="sm" onClick={onAddPlan} loading={isGenerating}>
            + 計画を追加
          </Button>
        }
      />

      {/* Work date and hours */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="text-sm text-gray-500 mb-1">作業日</div>
          <div className="text-base font-medium text-gray-900">{date}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">時間割</div>
          <div className="text-base font-medium text-gray-900">{workingHours}</div>
        </div>
      </div>

      {/* Timeline */}
      {blocks.length > 0 ? (
        <Timeline blocks={blocks} tasks={tasks} date={date} />
      ) : (
        <div className="text-center py-8 text-gray-500 text-base">
          計画がありません。「+ 計画を追加」ボタンから作成してください。
        </div>
      )}
    </Card>
  );
};
