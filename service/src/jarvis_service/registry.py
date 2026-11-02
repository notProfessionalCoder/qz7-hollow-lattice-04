"""插件注册表：从 jarvis_service.plugins 包里自动发现 Plugin 子类。"""

from __future__ import annotations

import importlib
import inspect
import pkgutil

from . import plugins as plugins_pkg
from .plugin import Plugin


class Registry:
    def __init__(self) -> None:
        self._plugins: dict[str, Plugin] = {}

    def register(self, plugin: Plugin) -> None:
        if not plugin.id:
            raise ValueError(f"{type(plugin).__name__} has no id")
        if plugin.id in self._plugins:
            raise ValueError(f"duplicate plugin id: {plugin.id}")
        self._plugins[plugin.id] = plugin

    def get(self, plugin_id: str) -> Plugin:
        return self._plugins[plugin_id]

    def all(self) -> list[Plugin]:
        return list(self._plugins.values())

    def discover(self) -> Registry:
        for info in pkgutil.iter_modules(plugins_pkg.__path__):
            module = importlib.import_module(f"{plugins_pkg.__name__}.{info.name}")
            for _, obj in inspect.getmembers(module, inspect.isclass):
                defined_here = obj.__module__ == module.__name__
                if issubclass(obj, Plugin) and obj is not Plugin and defined_here:
                    self.register(obj())
        return self
