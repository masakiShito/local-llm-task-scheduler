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
  is_fixed_time: boolean;
  fixed_start_at?: string;
  fixed_end_at?: string;
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
    is_fixed_time: false,
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
        is_fixed_time: task.is_fixed_time,
        fixed_start_at: task.fixed_start_at ? new Date(task.fixed_start_at).toISOString().slice(0, 16) : "",
        fixed_end_at: task.fixed_end_at ? new Date(task.fixed_end_at).toISOString().slice(0, 16) : "",
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
        is_fixed_time: false,
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
        is_fixed_time: formData.is_fixed_time,
      };

      if (formData.is_fixed_time) {
        // Fixed time task
        if (formData.fixed_start_at && formData.fixed_end_at) {
          submitData.fixed_start_at = new Date(formData.fixed_start_at).toISOString();
          submitData.fixed_end_at = new Date(formData.fixed_end_at).toISOString();
          // Calculate estimate_minutes from fixed times
          const duration = (new Date(formData.fixed_end_at).getTime() - new Date(formData.fixed_start_at).getTime()) / (1000 * 60);
          submitData.estimate_minutes = Math.max(5, Math.round(duration));
          submitData.priority = 3; // Default priority for fixed tasks
          submitData.splittable = false; // Fixed tasks cannot be split
        } else {
          throw new Error("固定時間タスクには開始時刻と終了時刻が必要です");
        }
      } else {
        // Regular task
        submitData.priority = formData.priority;
        submitData.estimate_minutes = formData.estimate_minutes;
        submitData.splittable = formData.splittable;

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
                placeholder="タスクのタイトルを入力"
              />
            </div>

            {/* Task Type Selection - Always visible */}
            <div>
              <label className="block text-sm font-medium mb-2">
                タスクタイプ <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.is_fixed_time}
                    onChange={() => setFormData({ ...formData, is_fixed_time: false })}
                    className="mr-2"
                  />
                  <span className="text-sm">通常タスク</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.is_fixed_time}
                    onChange={() => setFormData({ ...formData, is_fixed_time: true })}
                    className="mr-2"
                  />
                  <span className="text-sm">固定時間</span>
                </label>
              </div>
            </div>

            {/* Fixed Time Fields - Show only if is_fixed_time */}
            {formData.is_fixed_time && (
              <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <h3 className="text-sm font-semibold mb-3 text-red-800">📌 固定時間設定</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      開始時刻 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fixed_start_at || ""}
                      onChange={(e) => setFormData({ ...formData, fixed_start_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required={formData.is_fixed_time}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      終了時刻 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fixed_end_at || ""}
                      onChange={(e) => setFormData({ ...formData, fixed_end_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required={formData.is_fixed_time}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ※ 固定時間タスクはカレンダーの指定時刻に固定されます
                </p>
              </div>
            )}

            {/* Regular Task Fields - Show only if NOT is_fixed_time AND showDetails */}
            {!formData.is_fixed_time && showDetails && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 space-y-4">
                <h3 className="text-sm font-semibold mb-3 text-blue-800">⚡ 通常タスク詳細設定</h3>

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
                      <option value={5}>★★★★★ (最高)</option>
                      <option value={4}>★★★★☆ (高)</option>
                      <option value={3}>★★★☆☆ (普通)</option>
                      <option value={2}>★★☆☆☆ (低)</option>
                      <option value={1}>★☆☆☆☆ (最低)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      見積もり時間（分） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.estimate_minutes}
                      onChange={(e) => setFormData({ ...formData, estimate_minutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min={5}
                      max={1440}
                    />
                  </div>
                </div>

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

            {/* Description - Show only if showDetails */}
            {showDetails && (
              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  maxLength={2000}
                  placeholder="タスクの詳細説明（任意）"
                />
              </div>
            )}

            {/* Toggle Details Button - Show only for regular tasks */}
            {!formData.is_fixed_time && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  {showDetails ? "▲ 詳細を隠す" : "▼ 詳細を表示"}
                </button>
              </div>
            )}

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
