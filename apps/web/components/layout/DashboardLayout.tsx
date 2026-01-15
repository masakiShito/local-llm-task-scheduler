import React from 'react';

interface DashboardLayoutProps {
  leftColumn: React.ReactNode;
  centerColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  leftColumn,
  centerColumn,
  rightColumn,
}) => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日${['日', '月', '火', '水', '木', '金', '土'][currentDate.getDay()]}曜日`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <div className="text-sm text-gray-600">{formattedDate}</div>
        </div>
      </header>

      {/* Main content - 3 column grid */}
      <main className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto">
          {/* Left column - Tasks and Schedule */}
          <div className="lg:col-span-3 space-y-6">
            {leftColumn}
          </div>

          {/* Center column - Plan and Timeline */}
          <div className="lg:col-span-6">
            {centerColumn}
          </div>

          {/* Right column - AI Summary */}
          <div className="lg:col-span-3">
            {rightColumn}
          </div>
        </div>
      </main>
    </div>
  );
};
