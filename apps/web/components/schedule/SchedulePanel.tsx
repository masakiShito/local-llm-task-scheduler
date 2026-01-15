import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { ToggleSwitch } from '../common/ToggleSwitch';

interface SchedulePanelProps {
  title: string;
  showList: boolean;
  onToggleShowList: (show: boolean) => void;
  children: React.ReactNode;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  title,
  showList,
  onToggleShowList,
  children,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
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
