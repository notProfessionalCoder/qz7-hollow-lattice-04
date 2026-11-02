"""数据源插件接口。

每个数据源（Gmail、Outlook、系统监控……）实现一个 Plugin 子类：
- fetch(): 返回当前快照，给 HUD 面板渲染
- actions(): 声明可执行的动作，语音指令和 HUD 按钮都从这里生成
- run_action(): 执行动作；needs_confirm=True 的动作由上层先走确认队列
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Action:
    name: str
    description: str
    needs_confirm: bool = False
    params: dict[str, str] = field(default_factory=dict)


class Plugin(ABC):
    #: 唯一 id，用于路由和面板绑定
    id: str = ""
    #: HUD 上显示的名字
    title: str = ""
    #: 前端轮询/推送间隔（秒）
    interval: float = 5.0

    @abstractmethod
    async def fetch(self) -> dict[str, Any]:
        """返回当前数据快照（必须可 JSON 序列化）。"""

    def actions(self) -> list[Action]:
        return []

    async def run_action(self, name: str, params: dict[str, Any]) -> dict[str, Any]:
        raise KeyError(f"unknown action: {name}")

    def describe(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "interval": self.interval,
            "actions": [a.__dict__ for a in self.actions()],
        }
