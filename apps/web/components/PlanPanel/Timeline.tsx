import { PlanBlock } from "@/lib/types";
import { durationMinutes, formatTime, formatDuration, kindLabel } from "@/lib/utils";

export default function Timeline({ blocks }: { blocks: PlanBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        まだ計画がありません。右上の「計画を生成」でタイムラインが表示されます。
      </div>
    );
  }

  const bufferBlocks = blocks.filter((block) => block.kind === "buffer");
  const activeBlocks = blocks.filter((block) => block.kind !== "buffer");
  const bufferMinutes = bufferBlocks.reduce((total, block) => {
    const minutes = durationMinutes(block.start_at, block.end_at) ?? 0;
    return total + minutes;
  }, 0);

  return (
    <div className="space-y-3">
      {activeBlocks.map((block) => {
        const isBreak = block.kind === "break";
        return (
          <div
            key={block.block_id}
            className={`rounded-2xl border px-4 py-3 shadow-sm ${
              isBreak
                ? "border-slate-200 bg-slate-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {block.task_title ?? "予定"}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {kindLabel(block.kind)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>
                {formatTime(block.start_at)} - {formatTime(block.end_at)}
              </span>
              <span className="text-xs text-slate-500">
                {formatDuration(block.start_at, block.end_at)}
              </span>
            </div>
          </div>
        );
      })}

      {bufferMinutes > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-800">
              余り時間 / 調整時間
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {bufferMinutes}分
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
