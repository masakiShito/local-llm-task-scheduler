import React from 'react';

interface PlanBlock {
  block_id: string;
  start_at: string;
  end_at: string;
  kind: string;
  task_title: string | null;
  meta?: {
    is_fixed_time?: boolean;
    [key: string]: any;
  };
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

  // Check if this is a fixed time task
  const isFixedTime = block.meta?.is_fixed_time === true;

  // Check if this is a buffer block (work block without task title)
  const isBuffer = block.kind === 'work' && !block.task_title;

  const getBlockColor = () => {
    if (block.kind === 'break') {
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        label: 'bg-gray-200 text-gray-700',
        icon: '☕',
      };
    }

    if (isBuffer) {
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        text: 'text-purple-800',
        label: 'bg-purple-100 text-purple-700',
        icon: '⏸️',
      };
    }

    // Fixed time task styling
    if (isFixedTime) {
      return {
        bg: isCompleted ? 'bg-red-100' : 'bg-red-50',
        border: 'border-red-400',
        text: 'text-red-900',
        label: 'bg-red-200 text-red-800',
        icon: '🔒',
      };
    }

    if (isCompleted) {
      return {
        bg: 'bg-green-100',
        border: 'border-green-400',
        text: 'text-green-900',
        label: 'bg-green-200 text-green-800',
        icon: '✓',
      };
    }

    // Default colors for regular work blocks
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-900',
      label: 'bg-blue-200 text-blue-800',
      icon: '📝',
    };
  };

  const colors = getBlockColor();
  const startTime = formatTime(block.start_at);
  const endTime = formatTime(block.end_at);

  const getBlockTitle = () => {
    if (block.task_title) return block.task_title;
    if (block.kind === 'break') return 'ランチ休憩';
    return 'バッファ時間';
  };

  const getBlockLabel = () => {
    if (isFixedTime && isCompleted) return '🔒 完了';
    if (isFixedTime) return '🔒 固定予定';
    if (isCompleted) return '✓ 完了';
    if (block.kind === 'break') return '休憩';
    if (isBuffer) return 'バッファ';
    return '予定';
  };

  return (
    <div className={`${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-3 mb-2 transition-all hover:shadow-md ${
      isFixedTime ? 'border-l-[6px]' : ''
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`font-medium ${colors.text} flex items-center gap-2`}>
          <span className="text-lg">{colors.icon}</span>
          <span>{getBlockTitle()}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium ${colors.label}`}>
          {getBlockLabel()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-gray-600 font-medium">
          {startTime} - {endTime}
        </div>
      </div>
      {isFixedTime && (
        <div className="mt-2 text-xs text-red-700 italic">
          ※ この予定は固定されています
        </div>
      )}
    </div>
  );
};
