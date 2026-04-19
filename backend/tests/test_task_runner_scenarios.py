from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.services import task_runner


def _fake_task(task_id: str, prompt: str, model_id: str = "gemini-2.5-flash-image-preview"):
    return SimpleNamespace(
        id=task_id,
        status="queued",
        template="amazon",
        prompt=prompt,
        provider_model=model_id,
    )


class TaskRunnerScenarioTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        task_runner._active_runs.clear()

    async def test_run_batch_supports_partial_success(self) -> None:
        fake_tasks = {
            "task_success": _fake_task("task_success", "success"),
            "task_fail": _fake_task("task_fail", "fail"),
        }
        updates: list[tuple[str, dict]] = []

        async def fake_get_task(task_id: str):
            return fake_tasks[task_id]

        async def fake_update_task(task_id: str, **patch):
            updates.append((task_id, patch))
            return None

        async def fake_generate_image_for_task(template: str, prompt: str, request_id: str, model_id: str | None = None):
            if prompt == "success":
                return {
                    "resultUrl": "data:image/png;base64,AAAA",
                    "meta": {"modelId": model_id or "gemini-2.5-flash-image-preview"},
                }
            raise RuntimeError("请求已发出，但模型没有返回图片结果。请检查当前模型是否支持文生图。")

        async def fake_save_result_image(task_id: str, _result_url: str):
            return f"/outputs/{task_id}.png"

        with (
            patch("app.services.task_runner.load_ai_config", return_value=SimpleNamespace(batch_task_delay_seconds=0.0)),
            patch("app.services.task_runner.get_task", new=AsyncMock(side_effect=fake_get_task)),
            patch("app.services.task_runner.update_task", new=AsyncMock(side_effect=fake_update_task)),
            patch("app.services.task_runner.generate_image_for_task", new=AsyncMock(side_effect=fake_generate_image_for_task)),
            patch("app.services.task_runner.save_result_image", new=AsyncMock(side_effect=fake_save_result_image)),
        ):
            await task_runner.run_batch(["task_success", "task_fail"])

        final_status = {
            task_id: patch["status"]
            for task_id, patch in updates
            if patch.get("status") in {"succeeded", "failed"}
        }
        self.assertEqual(final_status["task_success"], "succeeded")
        self.assertEqual(final_status["task_fail"], "failed")

    async def test_run_batch_supports_all_failed(self) -> None:
        fake_tasks = {
            "task_a": _fake_task("task_a", "fail-a"),
            "task_b": _fake_task("task_b", "fail-b"),
        }
        updates: list[tuple[str, dict]] = []

        async def fake_get_task(task_id: str):
            return fake_tasks[task_id]

        async def fake_update_task(task_id: str, **patch):
            updates.append((task_id, patch))
            return None

        with (
            patch("app.services.task_runner.load_ai_config", return_value=SimpleNamespace(batch_task_delay_seconds=0.0)),
            patch("app.services.task_runner.get_task", new=AsyncMock(side_effect=fake_get_task)),
            patch("app.services.task_runner.update_task", new=AsyncMock(side_effect=fake_update_task)),
            patch(
                "app.services.task_runner.generate_image_for_task",
                new=AsyncMock(side_effect=RuntimeError("生成失败，请稍后重试。")),
            ),
            patch("app.services.task_runner.save_result_image", new=AsyncMock()),
        ):
            await task_runner.run_batch(["task_a", "task_b"])

        final_status = [
            patch["status"]
            for _, patch in updates
            if patch.get("status") in {"succeeded", "failed"}
        ]
        self.assertEqual(final_status, ["failed", "failed"])

    async def test_run_task_preserves_timeout_message(self) -> None:
        updates: list[tuple[str, dict]] = []

        async def fake_update_task(task_id: str, **patch):
            updates.append((task_id, patch))
            return None

        timeout_message = "请求已发出，但等待上游模型响应超时。当前任务不会继续等待该结果，请稍后重试。"

        with (
            patch("app.services.task_runner.get_task", new=AsyncMock(return_value=_fake_task("task_timeout", "timeout"))),
            patch("app.services.task_runner.update_task", new=AsyncMock(side_effect=fake_update_task)),
            patch(
                "app.services.task_runner.generate_image_for_task",
                new=AsyncMock(side_effect=RuntimeError(timeout_message)),
            ),
            patch("app.services.task_runner.save_result_image", new=AsyncMock()),
        ):
            await task_runner.run_task("task_timeout")

        final_patch = next(
            patch for _, patch in reversed(updates) if patch.get("status") == "failed"
        )
        self.assertEqual(final_patch["error_message"], timeout_message)

    async def test_run_batch_waits_between_tasks(self) -> None:
        fake_tasks = {
            "task_1": _fake_task("task_1", "prompt-1"),
            "task_2": _fake_task("task_2", "prompt-2"),
        }

        async def fake_get_task(task_id: str):
            return fake_tasks[task_id]

        async def fake_generate_image_for_task(_template: str, _prompt: str, _request_id: str, model_id: str | None = None):
            return {
                "resultUrl": "data:image/png;base64,AAAA",
                "meta": {"modelId": model_id or "gemini-2.5-flash-image-preview"},
            }

        async def fake_save_result_image(task_id: str, _result_url: str):
            return f"/outputs/{task_id}.png"

        sleep_mock = AsyncMock()

        with (
            patch("app.services.task_runner.load_ai_config", return_value=SimpleNamespace(batch_task_delay_seconds=5.0)),
            patch("app.services.task_runner.get_task", new=AsyncMock(side_effect=fake_get_task)),
            patch("app.services.task_runner.update_task", new=AsyncMock()),
            patch("app.services.task_runner.generate_image_for_task", new=AsyncMock(side_effect=fake_generate_image_for_task)),
            patch("app.services.task_runner.save_result_image", new=AsyncMock(side_effect=fake_save_result_image)),
            patch("app.services.task_runner.asyncio.sleep", new=sleep_mock),
        ):
            await task_runner.run_batch(["task_1", "task_2"])

        sleep_mock.assert_awaited_once_with(5.0)

    async def test_run_batch_fallbacks_to_default_delay_when_config_invalid(self) -> None:
        fake_tasks = {
            "task_1": _fake_task("task_1", "prompt-1"),
            "task_2": _fake_task("task_2", "prompt-2"),
        }

        async def fake_get_task(task_id: str):
            return fake_tasks[task_id]

        async def fake_generate_image_for_task(_template: str, _prompt: str, _request_id: str, model_id: str | None = None):
            return {
                "resultUrl": "data:image/png;base64,AAAA",
                "meta": {"modelId": model_id or "gemini-2.5-flash-image-preview"},
            }

        async def fake_save_result_image(task_id: str, _result_url: str):
            return f"/outputs/{task_id}.png"

        sleep_mock = AsyncMock()

        with (
            patch("app.services.task_runner.load_ai_config", side_effect=RuntimeError("bad config")),
            patch("app.services.task_runner.get_task", new=AsyncMock(side_effect=fake_get_task)),
            patch("app.services.task_runner.update_task", new=AsyncMock()),
            patch("app.services.task_runner.generate_image_for_task", new=AsyncMock(side_effect=fake_generate_image_for_task)),
            patch("app.services.task_runner.save_result_image", new=AsyncMock(side_effect=fake_save_result_image)),
            patch("app.services.task_runner.asyncio.sleep", new=sleep_mock),
        ):
            await task_runner.run_batch(["task_1", "task_2"])

        sleep_mock.assert_awaited_once_with(5.0)


if __name__ == "__main__":
    unittest.main()
