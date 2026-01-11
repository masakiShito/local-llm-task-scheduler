from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Iterable
from zoneinfo import ZoneInfo

from .schemas import Constraints, Event, OverflowItem, PlanBlock, Task, WarningItem


@dataclass
class ScheduleResult:
    blocks: list[PlanBlock]
    overflow: list[OverflowItem]
    warnings: list[WarningItem]


def _subtract_events(
    slots: list[tuple[datetime, datetime]],
    events: Iterable[Event],
) -> list[tuple[datetime, datetime]]:
    remaining = slots
    for event in events:
        updated: list[tuple[datetime, datetime]] = []
        for slot_start, slot_end in remaining:
            if event.end_at <= slot_start or event.start_at >= slot_end:
                updated.append((slot_start, slot_end))
                continue
            if event.start_at > slot_start:
                updated.append((slot_start, event.start_at))
            if event.end_at < slot_end:
                updated.append((event.end_at, slot_end))
        remaining = updated
    return remaining


def _apply_buffer(
    slots: list[tuple[datetime, datetime]],
    buffer_ratio: float,
) -> tuple[list[tuple[datetime, datetime]], list[PlanBlock], bool]:
    total_minutes = sum(int((end - start).total_seconds() / 60) for start, end in slots)
    buffer_minutes = int(total_minutes * buffer_ratio)
    if buffer_minutes <= 0:
        return slots, [], False

    buffer_blocks: list[PlanBlock] = []
    remaining_slots = slots[:]
    buffer_remaining = buffer_minutes
    while buffer_remaining > 0 and remaining_slots:
        start, end = remaining_slots[-1]
        slot_minutes = int((end - start).total_seconds() / 60)
        if slot_minutes <= buffer_remaining:
            buffer_blocks.append(
                PlanBlock(
                    block_id="",
                    plan_id="",
                    start_at=start,
                    end_at=end,
                    kind="buffer",
                    task_id=None,
                    task_title=None,
                    meta={},
                )
            )
            buffer_remaining -= slot_minutes
            remaining_slots.pop()
        else:
            buffer_start = end - timedelta(minutes=buffer_remaining)
            buffer_blocks.append(
                PlanBlock(
                    block_id="",
                    plan_id="",
                    start_at=buffer_start,
                    end_at=end,
                    kind="buffer",
                    task_id=None,
                    task_title=None,
                    meta={},
                )
            )
            remaining_slots[-1] = (start, buffer_start)
            buffer_remaining = 0

    buffer_blocks.reverse()
    buffer_shortage = buffer_remaining > 0
    return remaining_slots, buffer_blocks, buffer_shortage


def build_free_slots(
    target_date: date,
    timezone: str,
    working_hours: list[tuple[time, time]],
    events: Iterable[Event],
) -> list[tuple[datetime, datetime]]:
    tzinfo = ZoneInfo(timezone)
    slots = [
        (
            datetime.combine(target_date, slot_start, tzinfo=tzinfo),
            datetime.combine(target_date, slot_end, tzinfo=tzinfo),
        )
        for slot_start, slot_end in working_hours
    ]
    return _subtract_events(slots, events)


def schedule(
    tasks: Iterable[Task],
    free_slots: list[tuple[datetime, datetime]],
    constraints: Constraints,
    plan_id: str,
) -> ScheduleResult:
    blocks: list[PlanBlock] = []
    overflow: list[OverflowItem] = []
    warnings: list[WarningItem] = []

    buffer_slots, buffer_blocks, buffer_shortage = _apply_buffer(
        free_slots, constraints.buffer_ratio
    )
    if buffer_shortage:
        warnings.append(
            WarningItem(message_id="W-0211", message="バッファを確保できませんでした")
        )

    working_slots = buffer_slots
    tasks_sorted = sorted(
        tasks,
        key=lambda task: (
            -task.priority,
            task.due_at or datetime.max.replace(tzinfo=task.created_at.tzinfo),
            task.created_at,
        ),
    )

    slots = working_slots[:]
    for task in tasks_sorted:
        remaining = task.estimate_minutes
        min_block = task.min_block_minutes or 30
        allocated = False
        slot_index = 0
        while remaining > 0 and slot_index < len(slots):
            slot_start, slot_end = slots[slot_index]
            slot_minutes = int((slot_end - slot_start).total_seconds() / 60)
            if slot_minutes <= 0:
                slot_index += 1
                continue
            if not task.splittable and remaining > slot_minutes:
                slot_index += 1
                continue
            chunk = min(remaining, slot_minutes, constraints.focus_max_minutes)
            if task.splittable and chunk < min_block and remaining > min_block:
                slot_index += 1
                continue
            work_start = slot_start
            work_end = slot_start + timedelta(minutes=chunk)
            blocks.append(
                PlanBlock(
                    block_id="",
                    plan_id=plan_id,
                    start_at=work_start,
                    end_at=work_end,
                    kind="work",
                    task_id=task.task_id,
                    task_title=task.title,
                    meta={},
                )
            )
            remaining -= chunk
            allocated = True

            slot_start = work_end
            if remaining > 0:
                if constraints.break_minutes > 0:
                    break_end = slot_start + timedelta(minutes=constraints.break_minutes)
                    if break_end <= slot_end:
                        blocks.append(
                            PlanBlock(
                                block_id="",
                                plan_id=plan_id,
                                start_at=slot_start,
                                end_at=break_end,
                                kind="break",
                                task_id=None,
                                task_title=None,
                                meta={},
                            )
                        )
                        slot_start = break_end
                    else:
                        warnings.append(
                            WarningItem(
                                message_id="W-0210",
                                message="休憩を確保できませんでした",
                            )
                        )
            if slot_start >= slot_end:
                slots.pop(slot_index)
            else:
                slots[slot_index] = (slot_start, slot_end)
            if remaining == 0:
                break
        if not allocated or remaining > 0:
            overflow.append(
                OverflowItem(
                    task_id=task.task_id,
                    task_title=task.title,
                    estimate_minutes=task.estimate_minutes,
                    priority=task.priority,
                    due_at=task.due_at,
                    reason="not_enough_free_time",
                )
            )

    if overflow:
        warnings.append(
            WarningItem(
                message_id="W-0201",
                message="本日の空き時間に収まらないタスクがあります",
            )
        )

    blocks.extend(buffer_blocks)
    blocks.sort(key=lambda block: block.start_at)

    return ScheduleResult(blocks=blocks, overflow=overflow, warnings=warnings)
