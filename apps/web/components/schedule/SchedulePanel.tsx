import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { ToggleSwitch } from '../common/ToggleSwitch';

interface SchedulePanelProps {
  title: string;
  showList: boolean;
  onToggleShowList: (show: boolean) => void;
  onAdd?: () => void;
  children: React.ReactNode;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  title,
  showList,
  onToggleShowList,
  onAdd,
  children,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              title="追加"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        <ToggleSwitch
          checked={showList}
          onChange={onToggleShowList}
        />
      </div>

      {showList && (
        <div className="text-sm text-gray-600 px-2">
          {children}
        </div>
      )}
    </div>
  );
};
