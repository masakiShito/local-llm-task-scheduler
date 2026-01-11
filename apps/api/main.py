from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import FastAPI, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .errors import ApiError, FieldError, error_response
from .scheduler import build_free_slots, schedule
from .schemas import (
    Event,
    EventCreateRequest,
    EventUpdateRequest,
    Plan,
    PlanBlock,
    PlanGenerateRequest,
    PlanListItem,
    PlanParams,
    Task,
    TaskCreateRequest,
    TaskUpdateRequest,
    WarningItem,
    WorkingHour,
)
from .storage import STORE
from .validation import normalize_plan_request, validate_event_request, validate_task_request


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _now() -> datetime:
    return datetime.now(tz=ZoneInfo("Asia/Tokyo"))


@app.exception_handler(ApiError)
def handle_api_error(_, exc: ApiError) -> JSONResponse:
    return error_response(exc)


@app.exception_handler(RequestValidationError)
def handle_validation_error(_, exc: RequestValidationError) -> JSONResponse:
    field_errors = []
    for error in exc.errors():
        location = [str(part) for part in error.get("loc", []) if part not in ("body", "query", "path")]
        field = ".".join(location) if location else "request"
        field_errors.append(
            FieldError(field=field, message_id="E-0400", message="入力内容を確認してください")
        )
    return error_response(
        ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=field_errors,
        )
    )


@app.get("/tasks")
def list_tasks(status: str | None = None, q: str | None = None) -> dict:
    tasks = list(STORE.tasks.values())
    if status:
        tasks = [task for task in tasks if task.status == status]
    if q:
        tasks = [task for task in tasks if q in task.title]
    return {"data": tasks, "meta": {}}


@app.post("/tasks", status_code=201)
def create_task(request: TaskCreateRequest) -> dict:
    validate_task_request(TaskUpdateRequest(**request.model_dump()))
    task_id = str(uuid4())
    now = _now()
    task = Task(
        task_id=task_id,
        status="open",
        created_at=now,
        updated_at=now,
        **request.model_dump(),
    )
    STORE.tasks[task_id] = task
    return {"data": {"task_id": task_id}, "meta": {"message_id": "I-0001"}}


@app.get("/tasks/{task_id}")
def get_task(task_id: str) -> dict:
    task = STORE.tasks.get(task_id)
    if not task:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    return {"data": task, "meta": {}}


@app.patch("/tasks/{task_id}")
def update_task(task_id: str, request: TaskUpdateRequest) -> dict:
    task = STORE.tasks.get(task_id)
    if not task:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")

    validate_task_request(request)
    effective_splittable = request.splittable if request.splittable is not None else task.splittable
    if request.min_block_minutes is not None and not effective_splittable:
        raise ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=[
                FieldError("min_block_minutes", "E-0400", "分割不可では指定できません")
            ],
        )

    effective_available_from = request.available_from or task.available_from
    effective_available_to = request.available_to or task.available_to
    if effective_available_from and effective_available_to:
        if effective_available_from >= effective_available_to:
            raise ApiError(
                status_code=400,
                message_id="E-0400",
                message="入力内容が不正です",
                field_errors=[
                    FieldError("available_from", "E-0400", "開始日時を確認してください"),
                    FieldError("available_to", "E-0400", "終了日時を確認してください"),
                ],
            )

    updates = request.model_dump(exclude_unset=True)
    if request.splittable is False:
        updates["min_block_minutes"] = None
    updated_task = task.model_copy(update=updates)
    updated_task.updated_at = _now()
    STORE.tasks[task_id] = updated_task
    return {"data": {"task_id": task_id}, "meta": {"message_id": "I-0002"}}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: str) -> dict:
    task = STORE.tasks.pop(task_id, None)
    if not task:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    return {"data": {"task_id": task_id}, "meta": {"message_id": "I-0003"}}


@app.post("/tasks/{task_id}/complete")
def complete_task(task_id: str) -> dict:
    task = STORE.tasks.get(task_id)
    if not task:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    updated_task = task.model_copy(update={"status": "done", "updated_at": _now()})
    STORE.tasks[task_id] = updated_task
    return {
        "data": {"task_id": task_id, "status": "done"},
        "meta": {"message_id": "I-0004"},
    }


@app.post("/tasks/{task_id}/reopen")
def reopen_task(task_id: str) -> dict:
    task = STORE.tasks.get(task_id)
    if not task:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    updated_task = task.model_copy(update={"status": "open", "updated_at": _now()})
    STORE.tasks[task_id] = updated_task
    return {
        "data": {"task_id": task_id, "status": "open"},
        "meta": {"message_id": "I-0005"},
    }


@app.get("/events")
def list_events(date: date = Query(...)) -> dict:
    events = []
    tzinfo = ZoneInfo("Asia/Tokyo")
    for event in STORE.events.values():
        if event.start_at.astimezone(tzinfo).date() == date:
            events.append(event)
    return {"data": events, "meta": {}}


@app.post("/events", status_code=201)
def create_event(request: EventCreateRequest) -> dict:
    validate_event_request(EventUpdateRequest(**request.model_dump()))
    event_id = str(uuid4())
    now = _now()
    event = Event(
        event_id=event_id,
        locked=True,
        created_at=now,
        updated_at=now,
        **request.model_dump(),
    )
    STORE.events[event_id] = event
    return {"data": {"event_id": event_id}, "meta": {"message_id": "I-0101"}}


@app.get("/events/{event_id}")
def get_event(event_id: str) -> dict:
    event = STORE.events.get(event_id)
    if not event:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    return {"data": event, "meta": {}}


@app.patch("/events/{event_id}")
def update_event(event_id: str, request: EventUpdateRequest) -> dict:
    event = STORE.events.get(event_id)
    if not event:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    validate_event_request(request)
    effective_start = request.start_at or event.start_at
    effective_end = request.end_at or event.end_at
    if effective_start and effective_end and effective_start >= effective_end:
        raise ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=[
                FieldError("start_at", "E-0400", "開始日時を確認してください"),
                FieldError("end_at", "E-0400", "終了日時を確認してください"),
            ],
        )
    updates = request.model_dump(exclude_unset=True)
    updated_event = event.model_copy(update=updates)
    updated_event.updated_at = _now()
    STORE.events[event_id] = updated_event
    return {"data": {"event_id": event_id}, "meta": {"message_id": "I-0102"}}


@app.delete("/events/{event_id}")
def delete_event(event_id: str) -> dict:
    event = STORE.events.pop(event_id, None)
    if not event:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    return {"data": {"event_id": event_id}, "meta": {"message_id": "I-0103"}}


@app.get("/plans")
def list_plans(
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    if date_from and date_to and date_from > date_to:
        raise ApiError(
            status_code=400,
            message_id="E-0400",
            message="入力内容が不正です",
            field_errors=[FieldError("date_from", "E-0400", "日付範囲を確認してください")],
        )
    plans = []
    for plan in STORE.plans.values():
        if date_from and plan.date < date_from:
            continue
        if date_to and plan.date > date_to:
            continue
        plans.append(
            PlanListItem(
                plan_id=plan.plan_id,
                date=plan.date,
                timezone=plan.timezone,
                created_at=plan.created_at,
                updated_at=plan.updated_at,
            )
        )
    return {"data": plans, "meta": {}}


@app.get("/plans/{plan_id}")
def get_plan(plan_id: str) -> dict:
    plan = STORE.plans.get(plan_id)
    if not plan:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    return {"data": plan, "meta": {}}


@app.get("/plans/{plan_id}/blocks")
def get_plan_blocks(plan_id: str) -> dict:
    if plan_id not in STORE.plans:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    blocks = STORE.plan_blocks.get(plan_id, [])
    return {"data": blocks, "meta": {}}


@app.delete("/plans/{plan_id}")
def delete_plan(plan_id: str) -> dict:
    plan = STORE.plans.pop(plan_id, None)
    if not plan:
        raise ApiError(status_code=404, message_id="E-0404", message="対象データが存在しません")
    STORE.plan_blocks.pop(plan_id, None)
    return {"data": {"plan_id": plan_id}, "meta": {"message_id": "I-0202"}}


@app.post("/plans/generate")
def generate_plan(request: PlanGenerateRequest) -> dict:
    working_slots, constraints = normalize_plan_request(request)
    plan_id = str(uuid4())

    tzinfo = ZoneInfo(request.timezone)
    target_events = [
        event
        for event in STORE.events.values()
        if event.start_at.astimezone(tzinfo).date() == request.date
    ]
    free_slots = build_free_slots(
        request.date,
        request.timezone,
        working_slots,
        target_events,
    )

    tasks = [task for task in STORE.tasks.values() if task.status == "open"]
    schedule_result = schedule(tasks, free_slots, constraints, plan_id)

    summary = None
    warnings = schedule_result.warnings[:]
    warnings.append(
        WarningItem(message_id="W-0203", message="説明の生成に失敗しました")
    )

    params = PlanParams(
        working_hours=[
            WorkingHour(start=slot_start.strftime("%H:%M"), end=slot_end.strftime("%H:%M"))
            for slot_start, slot_end in working_slots
        ],
        constraints=constraints,
    )

    now = _now()
    plan = Plan(
        plan_id=plan_id,
        date=request.date,
        timezone=request.timezone,
        params=params,
        summary=summary,
        created_at=now,
        updated_at=now,
    )
    STORE.plans[plan_id] = plan

    stored_blocks: list[PlanBlock] = []
    for block in schedule_result.blocks:
        stored_blocks.append(
            PlanBlock(
                block_id=str(uuid4()),
                plan_id=plan_id,
                start_at=block.start_at,
                end_at=block.end_at,
                kind=block.kind,
                task_id=block.task_id,
                task_title=block.task_title,
                meta=block.meta or {},
            )
        )
    STORE.plan_blocks[plan_id] = stored_blocks

    return {
        "data": {
            "plan": plan,
            "blocks": stored_blocks,
            "overflow": schedule_result.overflow,
            "warnings": warnings,
        },
        "meta": {"message_id": "I-0201"},
    }
