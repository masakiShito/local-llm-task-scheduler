from datetime import date, datetime
from zoneinfo import ZoneInfo

import httpx

from apps.api.schemas import Constraints, OverflowItem, PlanBlock, Task
from apps.api.services.llm_summary import (
    FALLBACK_SUMMARY_MESSAGE,
    generate_llm_summary,
)
from apps.api.settings import Settings


def test_llm_summary_fallback_on_invalid_json() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"message": {"content": "not-json"}})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    settings = Settings(
        ollama_base_url="http://example.com",
        ollama_model="llama3.1:8b",
        ollama_timeout_sec=5,
        ollama_max_retries=1,
    )

    tzinfo = ZoneInfo("Asia/Tokyo")
    task = Task(
        task_id="task-1",
        title="Task A",
        description=None,
        type="task",
        priority=3,
        estimate_minutes=60,
        due_at=None,
        available_from=None,
        available_to=None,
        splittable=True,
        min_block_minutes=None,
        tags=None,
        status="open",
        created_at=datetime(2024, 1, 1, tzinfo=tzinfo),
        updated_at=datetime(2024, 1, 1, tzinfo=tzinfo),
    )
    block = PlanBlock(
        block_id="block-1",
        plan_id="plan-1",
        start_at=datetime(2024, 1, 2, 9, 0, tzinfo=tzinfo),
        end_at=datetime(2024, 1, 2, 10, 0, tzinfo=tzinfo),
        kind="work",
        task_id=task.task_id,
        task_title=task.title,
        meta={},
    )
    overflow = [
        OverflowItem(
            task_id=task.task_id,
            task_title=task.title,
            estimate_minutes=task.estimate_minutes,
            priority=task.priority,
            due_at=None,
            reason="not_enough_free_time",
        )
    ]

    result = generate_llm_summary(
        plan_date=date(2024, 1, 2),
        timezone="Asia/Tokyo",
        blocks=[block],
        overflow=overflow,
        constraints=Constraints(),
        tasks=[task],
        settings=settings,
        client=client,
    )

    assert result.succeeded is False
    assert result.summary.summary == FALLBACK_SUMMARY_MESSAGE
    assert result.summary.warnings == ["JSON不正"]
    assert result.summary.overflow_plan[0].taskTitle == task.title
