import { EventItem } from "@/lib/types";
import { cardBase } from "@/lib/styles";
import { formatTime } from "@/lib/utils";

type EventListProps = {
  events: EventItem[];
};

export default function EventList({ events }: EventListProps) {
  return (
    <div className={`${cardBase} p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">固定予定一覧</h3>
        <span className="text-xs text-slate-500">{events.length}件</span>
      </div>
      <div className="mt-4 space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-slate-500">
            まだ固定予定がありません。必要な予定を登録してください。
          </p>
        )}
        {events.map((event) => (
          <div
            key={event.event_id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="text-sm font-semibold text-slate-800">
              {event.title}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {formatTime(event.start_at)} - {formatTime(event.end_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
