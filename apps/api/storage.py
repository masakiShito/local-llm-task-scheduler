from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from .schemas import Event, Plan, PlanBlock, RecurringSchedule, Task


@dataclass
class InMemoryStore:
    tasks: Dict[str, Task] = field(default_factory=dict)
    events: Dict[str, Event] = field(default_factory=dict)
    plans: Dict[str, Plan] = field(default_factory=dict)
    plan_blocks: Dict[str, List[PlanBlock]] = field(default_factory=dict)
    recurring_schedules: Dict[str, RecurringSchedule] = field(default_factory=dict)


STORE = InMemoryStore()
