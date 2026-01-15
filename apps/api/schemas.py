from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    type: Literal["todo", "task"]
    priority: int
    estimate_minutes: int
    due_at: datetime | None = None
    available_from: datetime | None = None
    available_to: datetime | None = None
    splittable: bool = True
    min_block_minutes: int | None = None
    tags: list[str] | None = None


class TaskCreateRequest(TaskBase):
    pass


class TaskUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    type: Literal["todo", "task"] | None = None
    status: Literal["open", "done", "archived"] | None = None
    priority: int | None = None
    estimate_minutes: int | None = None
    due_at: datetime | None = None
    available_from: datetime | None = None
    available_to: datetime | None = None
    splittable: bool | None = None
    min_block_minutes: int | None = None
    tags: list[str] | None = None


class Task(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    task_id: str
    status: Literal["open", "done", "archived"]
    created_at: datetime
    updated_at: datetime


class EventBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    start_at: datetime
    end_at: datetime
    description: str | None = Field(default=None, max_length=2000)


class EventCreateRequest(EventBase):
    pass


class EventUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    start_at: datetime | None = None
    end_at: datetime | None = None
    description: str | None = Field(default=None, max_length=2000)


class Event(EventBase):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    locked: bool
    created_at: datetime
    updated_at: datetime


class WorkingHour(BaseModel):
    start: str
    end: str


class Constraints(BaseModel):
    break_minutes: int = 10
    focus_max_minutes: int = 90
    buffer_ratio: float = 0.0


class PlanGenerateRequest(BaseModel):
    date: date
    timezone: str
    working_hours: list[WorkingHour]
    constraints: Constraints | None = None


class PlanParams(BaseModel):
    working_hours: list[WorkingHour]
    constraints: Constraints


class Plan(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: str
    date: date
    timezone: str
    params: PlanParams
    summary: dict | None = None
    created_at: datetime
    updated_at: datetime


class PlanListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: str
    date: date
    timezone: str
    created_at: datetime
    updated_at: datetime


class PlanBlock(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    block_id: str
    plan_id: str
    start_at: datetime
    end_at: datetime
    kind: Literal["work", "break", "buffer"]
    task_id: str | None = None
    task_title: str | None = None
    meta: dict | None = None


class OverflowItem(BaseModel):
    task_id: str
    task_title: str
    estimate_minutes: int
    priority: int
    due_at: datetime | None
    reason: str


class WarningItem(BaseModel):
    message_id: str
    message: str


class RecurringScheduleBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    days_of_week: list[int] = Field(min_length=1, max_length=7)
    valid_from: date | None = None
    valid_to: date | None = None


class RecurringScheduleCreateRequest(RecurringScheduleBase):
    pass


class RecurringScheduleUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    start_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    days_of_week: list[int] | None = Field(default=None, min_length=1, max_length=7)
    valid_from: date | None = None
    valid_to: date | None = None


class RecurringSchedule(RecurringScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    recurring_schedule_id: str
    created_at: datetime
    updated_at: datetime
