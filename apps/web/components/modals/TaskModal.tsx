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
    } else {
      setFormData({
        title: "",
        description: "",
        type: "task",
        priority: 3,
        estimate_minutes: 60,
        splittable: true,
      });
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  タイプ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "todo" | "task" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="task">タスク</option>
                  <option value="todo">TODO</option>
                </select>
              </div>

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
                  <option value={1}>低</option>
                  <option value={2}>やや低</option>
                  <option value={3}>普通</option>
                  <option value={4}>やや高</option>
                  <option value={5}>高</option>
                </select>
              </div>
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
                min={1}
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">実施可能開始</label>
                <input
                  type="datetime-local"
                  value={formData.available_from || ""}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">実施可能終了</label>
                <input
                  type="datetime-local"
                  value={formData.available_to || ""}
                  onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.splittable}
                  onChange={(e) => setFormData({ ...formData, splittable: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">分割可能</span>
              </label>
            </div>

            {formData.splittable && (
              <div>
                <label className="block text-sm font-medium mb-1">最小ブロック時間（分）</label>
                <input
                  type="number"
                  value={formData.min_block_minutes || ""}
                  onChange={(e) => setFormData({ ...formData, min_block_minutes: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
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
                disabled={isSubmitting}
              >
                {isSubmitting ? "保存中..." : task ? "更新" : "追加"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
