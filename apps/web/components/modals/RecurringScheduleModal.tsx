"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";

type RecurringScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: RecurringScheduleFormData) => Promise<void>;
  schedule?: {
    recurring_schedule_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    days_of_week: number[];
    valid_from?: string;
    valid_to?: string;
  };
};

export type RecurringScheduleFormData = {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  valid_from?: string;
  valid_to?: string;
};

const DAYS_OF_WEEK = [
  { value: 0, label: "月" },
  { value: 1, label: "火" },
  { value: 2, label: "水" },
  { value: 3, label: "木" },
  { value: 4, label: "金" },
  { value: 5, label: "土" },
  { value: 6, label: "日" },
];

export function RecurringScheduleModal({ isOpen, onClose, onSave, schedule }: RecurringScheduleModalProps) {
  const [formData, setFormData] = useState<RecurringScheduleFormData>({
    title: "",
    description: "",
    start_time: "09:00",
    end_time: "10:00",
    days_of_week: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title,
        description: schedule.description || "",
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        days_of_week: schedule.days_of_week,
        valid_from: schedule.valid_from || "",
        valid_to: schedule.valid_to || "",
      });
    } else if (isOpen) {
      setFormData({
        title: "",
        description: "",
        start_time: "09:00",
        end_time: "10:00",
        days_of_week: [],
      });
    }
  }, [schedule, isOpen]);

  const handleDayToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (formData.days_of_week.length === 0) {
        throw new Error("曜日を少なくとも1つ選択してください");
      }

      // Validate times
      if (formData.start_time >= formData.end_time) {
        throw new Error("終了時刻は開始時刻より後にしてください");
      }

      const submitData: any = {
        title: formData.title,
        description: formData.description || undefined,
        start_time: formData.start_time,
        end_time: formData.end_time,
        days_of_week: formData.days_of_week,
      };

      if (formData.valid_from) {
        submitData.valid_from = formData.valid_from;
      }
      if (formData.valid_to) {
        submitData.valid_to = formData.valid_to;
      }

      // Validate date range
      if (formData.valid_from && formData.valid_to && formData.valid_from > formData.valid_to) {
        throw new Error("有効期限終了日は開始日より後にしてください");
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
            {schedule ? "繰り返し予定編集" : "繰り返し予定追加"}
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
                  開始時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  終了時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                繰り返す曜日 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      formData.days_of_week.includes(day.value)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">有効期限開始</label>
                <input
                  type="date"
                  value={formData.valid_from || ""}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">有効期限終了</label>
                <input
                  type="date"
                  value={formData.valid_to || ""}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                loading={isSubmitting}
              >
                {schedule ? "更新" : "追加"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
