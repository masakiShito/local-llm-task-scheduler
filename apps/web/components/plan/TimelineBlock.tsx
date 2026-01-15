import React from 'react';

interface PlanBlock {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
}

interface TimelineBlockProps {
  block: PlanBlock;
  isCompleted?: boolean;
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ block, isCompleted }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getBlockColor = () => {
    if (block.kind === 'break') {
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        label: 'bg-gray-200 text-gray-700',
      };
    }

    if (isCompleted) {
      return {
        bg: 'bg-green-100',
        border: 'border-green-400',
        text: 'text-green-900',
        label: 'bg-green-200 text-green-800',
      };
    }

    // Default colors for work blocks
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
      label: 'bg-yellow-200 text-yellow-800',
    };
  };

  const colors = getBlockColor();
  const startTime = formatTime(block.start_at);
  const endTime = formatTime(block.end_at);

  return (
    <div className={`${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-3 mb-2`}>
      <div className={`font-medium ${colors.text} mb-1`}>
        {block.task_title || (block.kind === 'break' ? 'ランチ休憩' : 'バッファ時間')}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {startTime} - {endTime}
        </div>
        {block.kind === 'break' && (
          <span className={`text-xs px-2 py-1 rounded ${colors.label}`}>
            休憩
          </span>
        )}
        {isCompleted && (
          <span className={`text-xs px-2 py-1 rounded ${colors.label}`}>
            完了
          </span>
        )}
        {!isCompleted && block.kind === 'work' && (
          <span className={`text-xs px-2 py-1 rounded ${colors.label}`}>
            予定
          </span>
        )}
      </div>
    </div>
  );
};
