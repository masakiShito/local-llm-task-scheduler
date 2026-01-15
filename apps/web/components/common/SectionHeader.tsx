import React from 'react';

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  action,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <div className="text-indigo-600">{icon}</div>}
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
