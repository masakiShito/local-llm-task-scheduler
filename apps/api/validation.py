from __future__ import annotations

from datetime import time

from .errors import ApiError, FieldError
from .schemas import Constraints, EventUpdateRequest, PlanGenerateRequest, TaskUpdateRequest


def _time_from_hhmm(value: str) -> time | None:
    try:
        parts = value.split(":")
        if len(parts) != 2:
            return None
        hour = int(parts[0])
        minute = int(parts[1])
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            return None
        return time(hour=hour, minute=minute)
    except ValueError:
        return None


def validate_task_request(request: TaskUpdateRequest) -> None:
    field_errors: list[FieldError] = []
    if request.priority is not None and not (1 <= request.priority <= 5):
        field_errors.append(
            FieldError("priority", "E-0400", "1〜5で入力してください")
        )
    if request.estimate_minutes is not None and not (5 <= request.estimate_minutes <= 1440):
        field_errors.append(
            FieldError("estimate_minutes", "E-0400", "5〜1440で入力してください")
        )
    if request.available_from and request.available_to:
        if request.available_from >= request.available_to:
            field_errors.append(
                FieldError("available_from", "E-0400", "開始日時を確認してください")
            )
            field_errors.append(
                FieldError("available_to", "E-0400", "終了日時を確認してください")
            )
    if request.min_block_minutes is not None:
        if request.splittable is False:
            field_errors.append(
                FieldError("min_block_minutes", "E-0400", "分割不可では指定できません")
            )
        elif not (5 <= request.min_block_minutes <= 180):
            field_errors.append(
                FieldError("min_block_minutes", "E-0400", "5〜180で入力してください")
            )
    if field_errors:
        raise ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=field_errors,
        )


def validate_event_request(request: EventUpdateRequest) -> None:
    field_errors: list[FieldError] = []
    if request.start_at and request.end_at:
        if request.start_at >= request.end_at:
            field_errors.append(
                FieldError("start_at", "E-0400", "開始日時を確認してください")
            )
            field_errors.append(
                FieldError("end_at", "E-0400", "終了日時を確認してください")
            )
    if field_errors:
        raise ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=field_errors,
        )


def normalize_plan_request(request: PlanGenerateRequest) -> tuple[list[tuple[time, time]], Constraints]:
    field_errors: list[FieldError] = []
    if request.timezone != "Asia/Tokyo":
        field_errors.append(
            FieldError("timezone", "E-0400", "Asia/Tokyoのみ指定できます")
        )
    if not (1 <= len(request.working_hours) <= 3):
        field_errors.append(
            FieldError("working_hours", "E-0400", "1〜3件で入力してください")
        )

    working_slots: list[tuple[time, time]] = []
    for index, slot in enumerate(request.working_hours):
        start = _time_from_hhmm(slot.start)
        end = _time_from_hhmm(slot.end)
        if start is None:
            field_errors.append(
                FieldError(f"working_hours.{index}.start", "E-0400", "開始時刻を確認してください")
            )
        if end is None:
            field_errors.append(
                FieldError(f"working_hours.{index}.end", "E-0400", "終了時刻を確認してください")
            )
        if start and end and start >= end:
            field_errors.append(
                FieldError(f"working_hours.{index}.start", "E-0400", "開始時刻を確認してください")
            )
            field_errors.append(
                FieldError(f"working_hours.{index}.end", "E-0400", "終了時刻を確認してください")
            )
        if start and end and start < end:
            working_slots.append((start, end))

    constraints = request.constraints or Constraints()
    if not (0 <= constraints.break_minutes <= 30):
        field_errors.append(
            FieldError("constraints.break_minutes", "E-0400", "0〜30で入力してください")
        )
    if not (30 <= constraints.focus_max_minutes <= 180):
        field_errors.append(
            FieldError("constraints.focus_max_minutes", "E-0400", "30〜180で入力してください")
        )
    if not (0.0 <= constraints.buffer_ratio <= 0.30):
        field_errors.append(
            FieldError("constraints.buffer_ratio", "E-0400", "0.00〜0.30で入力してください")
        )

    working_slots.sort(key=lambda slot: slot[0])
    for index in range(1, len(working_slots)):
        previous_end = working_slots[index - 1][1]
        current_start = working_slots[index][0]
        if current_start <= previous_end:
            field_errors.append(
                FieldError("working_hours", "E-0400", "時間帯が重複しています")
            )
            break

    if field_errors:
        raise ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=field_errors,
        )

    return working_slots, constraints
