from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import date
from typing import Iterable

import httpx
from pydantic import BaseModel, Field, ValidationError

from ..schemas import Constraints, OverflowItem, PlanBlock, Task
from ..settings import Settings, get_settings

logger = logging.getLogger(__name__)


FALLBACK_SUMMARY_MESSAGE = (
    "説明の生成に失敗しました（LLM）。計画自体はロジックで生成されています。"
)


class LlmSummaryOverflowPlan(BaseModel):
    taskTitle: str
    suggestions: list[str]


class LlmSummary(BaseModel):
    summary: str
    why_this_order: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    overflow_plan: list[LlmSummaryOverflowPlan] = Field(default_factory=list)


@dataclass
class LlmSummaryResult:
    summary: LlmSummary
    succeeded: bool


def build_llm_summary_input(
    *,
    plan_date: date,
    timezone: str,
    blocks: list[PlanBlock],
    overflow: list[OverflowItem],
    constraints: Constraints,
    tasks: Iterable[Task],
) -> dict:
    task_map = {task.task_id: task for task in tasks}
    llm_blocks: list[dict] = []

    for block in blocks:
        if block.kind != "work":
            continue
        task = task_map.get(block.task_id)
        if not task:
            # TODO: Handle missing task details if upstream data changes.
            continue
        llm_blocks.append(
            {
                "start": block.start_at.isoformat(),
                "end": block.end_at.isoformat(),
                "taskTitle": task.title,
                "estimate": task.estimate_minutes,
                "priority": task.priority,
                "dueAt": task.due_at.isoformat() if task.due_at else None,
            }
        )

    llm_overflow = [
        {
            "taskTitle": item.task_title,
            "estimate": item.estimate_minutes,
            "priority": item.priority,
            "dueAt": item.due_at.isoformat() if item.due_at else None,
            "reason": item.reason,
        }
        for item in overflow
    ]

    return {
        "date": plan_date.isoformat(),
        "timezone": timezone,
        "blocks": llm_blocks,
        "overflow": llm_overflow,
        "constraints": {
            "focusMaxMinutes": constraints.focus_max_minutes,
            "breakMinutes": constraints.break_minutes,
            "bufferRatio": constraints.buffer_ratio,
        },
    }


def generate_llm_summary(
    *,
    plan_date: date,
    timezone: str,
    blocks: list[PlanBlock],
    overflow: list[OverflowItem],
    constraints: Constraints,
    tasks: Iterable[Task],
    settings: Settings | None = None,
    client: httpx.Client | None = None,
) -> LlmSummaryResult:
    effective_settings = settings or get_settings()
    llm_input = build_llm_summary_input(
        plan_date=plan_date,
        timezone=timezone,
        blocks=blocks,
        overflow=overflow,
        constraints=constraints,
        tasks=tasks,
    )
    max_retries = max(effective_settings.ollama_max_retries, 1)
    last_reason = "不明"

    for attempt in range(1, max_retries + 1):
        temperature = 0.0 if attempt > 1 else 0.2
        try:
            summary = _request_llm_summary(
                llm_input=llm_input,
                settings=effective_settings,
                temperature=temperature,
                client=client,
            )
            return LlmSummaryResult(summary=summary, succeeded=True)
        except httpx.TimeoutException as exc:
            last_reason = "タイムアウト"
            _log_llm_failure(exc, attempt, getattr(exc, "response", None))
        except httpx.HTTPError as exc:
            last_reason = "HTTPエラー"
            _log_llm_failure(exc, attempt, getattr(exc, "response", None))
        except json.JSONDecodeError as exc:
            last_reason = "JSON不正"
            _log_llm_failure(exc, attempt, None)
        except ValidationError as exc:
            last_reason = "スキーマ不一致"
            _log_llm_failure(exc, attempt, None)
        except ValueError as exc:
            last_reason = "JSON不正"
            _log_llm_failure(exc, attempt, None)

    fallback = _build_fallback_summary(overflow=overflow, reason=last_reason)
    return LlmSummaryResult(summary=fallback, succeeded=False)


def _request_llm_summary(
    *,
    llm_input: dict,
    settings: Settings,
    temperature: float,
    client: httpx.Client | None,
) -> LlmSummary:
    system_prompt = (
        "You are a scheduling assistant. You must only summarize the provided plan. "
        "Do not optimize or re-assign tasks. Use only the facts in the input JSON. "
        "Return ONLY valid JSON that matches the required schema."
    )
    user_prompt = (
        "入力JSONをもとに、説明文を生成してください。\n"
        "以下のスキーマに厳密に従い、JSONのみで返答してください。\n"
        "{\n"
        "  \"summary\": \"string\",\n"
        "  \"why_this_order\": [\"string\"],\n"
        "  \"warnings\": [\"string\"],\n"
        "  \"overflow_plan\": [\n"
        "    { \"taskTitle\": \"string\", \"suggestions\": [\"string\"] }\n"
        "  ]\n"
        "}\n\n"
        "入力JSON:\n"
        f"{json.dumps(llm_input, ensure_ascii=False)}"
    )

    payload = {
        "model": settings.ollama_model,
        "stream": False,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    http_client = client or httpx.Client(timeout=settings.ollama_timeout_sec)
    try:
        response = http_client.post(
            f"{settings.ollama_base_url}/api/chat",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    finally:
        if client is None:
            http_client.close()

    content = data.get("message", {}).get("content")
    if not content:
        raise ValueError("Missing content")

    parsed = json.loads(content)
    return LlmSummary.model_validate(parsed)


def _build_fallback_summary(*, overflow: list[OverflowItem], reason: str) -> LlmSummary:
    overflow_plan = [
        LlmSummaryOverflowPlan(
            taskTitle=item.task_title,
            suggestions=[
                "翌日以降に回すことを検討してください。",
                "作業時間の追加や優先度の調整を検討してください。",
            ],
        )
        for item in overflow
    ]
    return LlmSummary(
        summary=FALLBACK_SUMMARY_MESSAGE,
        why_this_order=[],
        warnings=[reason],
        overflow_plan=overflow_plan,
    )


def _log_llm_failure(exc: Exception, attempt: int, response: httpx.Response | None) -> None:
    status_code = response.status_code if response is not None else None
    logger.warning(
        "LLM summary generation failed (attempt=%s, error=%s, status=%s)",
        attempt,
        type(exc).__name__,
        status_code,
    )
