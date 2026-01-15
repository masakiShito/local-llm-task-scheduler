import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  offLabel?: string;
  onLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  offLabel = 'OFF',
  onLabel = '一覧',
}) => {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onChange(false)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            !checked
              ? 'bg-white text-gray-700 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          {offLabel}
        </button>
        <button
          onClick={() => onChange(true)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            checked
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500'
          }`}
        >
          {onLabel}
        </button>
      </div>
    </div>
  );
};
