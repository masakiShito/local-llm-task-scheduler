"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskFormData) => Promise<void>;
  task?: {
    task_id: string;
    title: string;
    description?: string;
    type: string;
    priority: number;
    estimate_minutes: number;
    due_at?: string;
    available_from?: string;
    available_to?: string;
    splittable: boolean;
    min_block_minutes?: number;
    is_fixed_time: boolean;
    fixed_start_at?: string;
    fixed_end_at?: string;
  };
};

export type TaskFormData = {
  title: string;
  description?: string;
  type: "todo" | "task";
  priority: number;
  estimate_minutes: number;
  due_at?: string;
  available_from?: string;
  available_to?: string;
  splittable: boolean;
  min_block_minutes?: number;
};

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    type: "task",
    priority: 3,
    estimate_minutes: 60,
    splittable: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        type: task.type as "todo" | "task",
        priority: task.priority,
        estimate_minutes: task.estimate_minutes,
        due_at: task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : "",
        available_from: task.available_from ? new Date(task.available_from).toISOString().slice(0, 16) : "",
        available_to: task.available_to ? new Date(task.available_to).toISOString().slice(0, 16) : "",
        splittable: task.splittable,
        min_block_minutes: task.min_block_minutes,
      });
      setShowDetails(true); // Show details when editing
    } else {
      setFormData({
        title: "",
        description: "",
        type: "task",
        priority: 3,
        estimate_minutes: 60,
        splittable: true,
      });
      setShowDetails(false);
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData: any = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        priority: formData.priority,
        estimate_minutes: formData.estimate_minutes,
        splittable: formData.splittable,
      };

      if (formData.due_at) {
        submitData.due_at = new Date(formData.due_at).toISOString();
      }
      if (formData.available_from) {
        submitData.available_from = new Date(formData.available_from).toISOString();
      }
      if (formData.available_to) {
        submitData.available_to = new Date(formData.available_to).toISOString();
      }
      if (formData.splittable && formData.min_block_minutes) {
        submitData.min_block_minutes = formData.min_block_minutes;
      }

      await onSave(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {task ? "タスク編集" : "タスク追加"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title - Always visible */}
            <div>
              <label className="block text-sm font-medium mb-1">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                maxLength={100}
                placeholder="例: レポート作成"
              />
            </div>

            {/* Priority and Estimate - Always visible */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  優先度 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={5}>★★★★★ 最優先</option>
                  <option value={4}>★★★★☆ 高</option>
                  <option value={3}>★★★☆☆ 中</option>
                  <option value={2}>★★☆☆☆ 低</option>
                  <option value={1}>★☆☆☆☆ 最低</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  想定時間 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.estimate_minutes}
                  onChange={(e) => setFormData({ ...formData, estimate_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={15}>15分</option>
                  <option value={30}>30分</option>
                  <option value={45}>45分</option>
                  <option value={60}>1時間</option>
                  <option value={90}>1.5時間</option>
                  <option value={120}>2時間</option>
                  <option value={180}>3時間</option>
                </select>
              </div>
            </div>

            {/* Description - Always visible (optional) */}
            <div>
              <label className="block text-sm font-medium mb-1">メモ</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                maxLength={2000}
                placeholder="補足があれば入力してください"
              />
            </div>

            {/* Advanced Settings - Show only if showDetails */}
            {showDetails && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 space-y-4">
                <h3 className="text-sm font-semibold mb-3 text-blue-800">⚡ 詳細設定</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">期限</label>
                  <input
                    type="datetime-local"
                    value={formData.due_at || ""}
                    onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.splittable}
                      onChange={(e) => setFormData({ ...formData, splittable: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">分割可能</span>
                  </label>
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    複数の時間ブロックに分割して実行できます
                  </p>
                </div>

                {formData.splittable && (
                  <div>
                    <label className="block text-sm font-medium mb-1">最小ブロック時間（分）</label>
                    <input
                      type="number"
                      value={formData.min_block_minutes || ""}
                      onChange={(e) => setFormData({ ...formData, min_block_minutes: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={5}
                      max={180}
                      placeholder="30"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      分割時の最小時間（デフォルト: 30分）
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Toggle Details Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                {showDetails ? "▲ 詳細を隠す" : "▼ 詳細を表示"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={onClose}
                type="button"
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
              >
                {task ? "更新" : "追加"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
