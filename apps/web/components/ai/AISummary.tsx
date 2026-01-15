import React from 'react';
import { Card } from '../common/Card';
import { SectionHeader } from '../common/SectionHeader';

interface LlmSummaryOverflowPlan {
  taskTitle: string;
  suggestions: string[];
}

interface LlmSummary {
  summary: string;
  why_this_order: string[];
  warnings: string[];
  overflow_plan: LlmSummaryOverflowPlan[];
}

interface AISummaryProps {
  summary: LlmSummary | null;
}

export const AISummary: React.FC<AISummaryProps> = ({ summary }) => {
  if (!summary) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <SectionHeader
          title="AIサマリー"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
        <p className="text-sm text-gray-600 mt-2">
          計画を生成するとAIがサマリーを表示します。
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
      <SectionHeader
        title="AIサマリー"
        icon={
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
      />

      {/* Summary */}
      <div className="mt-4">
        <h3 className="text-sm font-bold text-purple-900 mb-2">サマリー</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{summary.summary}</p>
      </div>

      {/* Why this order */}
      {summary.why_this_order.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-purple-900 mb-2">開始の準備</h3>
          <ul className="space-y-1">
            {summary.why_this_order.map((reason, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h3 className="text-sm font-bold text-yellow-900 mb-2">AI提案事項</h3>
          <ul className="space-y-1">
            {summary.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Overflow plan */}
      {summary.overflow_plan.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-purple-900 mb-2">突発的な案件への対応</h3>
          <div className="space-y-2">
            {summary.overflow_plan.map((plan, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-gray-900">{plan.taskTitle}</div>
                <ul className="ml-4 mt-1 space-y-0.5">
                  {plan.suggestions.map((suggestion, sIndex) => (
                    <li key={sIndex} className="text-gray-700 flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">-</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview link */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          オーバーフロー一覧
        </button>
      </div>
    </Card>
  );
};
