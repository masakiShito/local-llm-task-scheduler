import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';
import { SchedulePanel } from './SchedulePanel';

interface ScheduleSectionProps {
  // Fixed schedules
  showFixedSchedules: boolean;
  onToggleShowFixedSchedules: (show: boolean) => void;
  fixedSchedulesContent: React.ReactNode;
  onAddFixedSchedule?: () => void;

  // Recurring schedules
  showRecurringSchedules: boolean;
  onToggleShowRecurringSchedules: (show: boolean) => void;
  recurringSchedulesContent: React.ReactNode;
  onAddRecurringSchedule?: () => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  showFixedSchedules,
  onToggleShowFixedSchedules,
  fixedSchedulesContent,
  onAddFixedSchedule,
  showRecurringSchedules,
  onToggleShowRecurringSchedules,
  recurringSchedulesContent,
  onAddRecurringSchedule,
}) => {
  return (
    <Card>
      <SectionHeader
        title="予定"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      <div className="space-y-4">
        <SchedulePanel
          title="固定予定"
          showList={showFixedSchedules}
          onToggleShowList={onToggleShowFixedSchedules}
          onAdd={onAddFixedSchedule}
        >
          {fixedSchedulesContent}
        </SchedulePanel>

        <SchedulePanel
          title="繰り返し予定"
          showList={showRecurringSchedules}
          onToggleShowList={onToggleShowRecurringSchedules}
          onAdd={onAddRecurringSchedule}
        >
          {recurringSchedulesContent}
        </SchedulePanel>
      </div>
    </Card>
  );
};
