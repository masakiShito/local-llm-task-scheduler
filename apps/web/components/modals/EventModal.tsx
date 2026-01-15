"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";

type EventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventFormData) => Promise<void>;
  defaultDate?: string;
  event?: {
    event_id: string;
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
  };
};

export type EventFormData = {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
};

export function EventModal({ isOpen, onClose, onSave, defaultDate, event }: EventModalProps) {
  const getDefaultStartTime = () => {
    if (defaultDate) {
      return `${defaultDate}T09:00`;
    }
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    if (defaultDate) {
      return `${defaultDate}T10:00`;
    }
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    start_at: getDefaultStartTime(),
    end_at: getDefaultEndTime(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        start_at: new Date(event.start_at).toISOString().slice(0, 16),
        end_at: new Date(event.end_at).toISOString().slice(0, 16),
      });
    } else if (isOpen) {
      setFormData({
        title: "",
        description: "",
        start_at: getDefaultStartTime(),
        end_at: getDefaultEndTime(),
      });
    }
  }, [event, isOpen, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData: EventFormData = {
        title: formData.title,
        description: formData.description || undefined,
        start_at: new Date(formData.start_at).toISOString(),
        end_at: new Date(formData.end_at).toISOString(),
      };

      // Validate dates
      if (new Date(submitData.start_at) >= new Date(submitData.end_at)) {
        throw new Error("終了日時は開始日時より後にしてください");
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {event ? "イベント編集" : "イベント追加"}
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
                  開始日時 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  終了日時 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

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
                {isSubmitting ? "保存中..." : event ? "更新" : "追加"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
