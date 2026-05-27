"""Tests for JS source code content validation."""

import os
import re

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_js(filename):
    with open(os.path.join(ROOT, filename)) as f:
        return f.read()


class TestMainJS:
    """Tests for js/main.js content."""

    @pytest.fixture(autouse=True)
    def content(self):
        return read_js("js/main.js")

    def test_has_error_classes(self, content):
        assert "class ConstraintTheoryError" in content
        assert "class InputValidationError" in content
        assert "class CanvasError" in content

    def test_has_validate_number(self, content):
        assert "function validateNumber" in content
        assert "typeof value !== 'number'" in content

    def test_has_safe_execute(self, content):
        assert "function safeExecute" in content
        assert "function safeExecuteAsync" in content

    def test_has_agent_simulation(self, content):
        assert "class AgentSimulation" in content
        assert "class Navigation" in content

    def test_has_debounce_throttle(self, content):
        assert "function" in content and "debounce" in content
        assert "function" in content and "throttle" in content

    def test_exports_present(self, content):
        assert "module.exports" in content


class TestMonitoringJS:
    """Tests for js/monitoring.js content."""

    @pytest.fixture(autouse=True)
    def content(self):
        return read_js("js/monitoring.js")

    def test_has_metrics_class(self, content):
        assert "class ConstraintTheoryMetrics" in content

    def test_has_prometheus_export(self, content):
        assert "toPrometheus" in content
        assert "constraint_kdtree_queries_total" in content

    def test_has_health_check(self, content):
        assert "getHealth" in content
        assert "healthy" in content

    def test_has_observer_pattern(self, content):
        assert "subscribe" in content
        assert "unsubscribe" in content
        assert "notifyObservers" in content

    def test_has_fps_rts_comparison(self, content):
        assert "getFPSvsRTSComparison" in content


class TestWasmIndexJS:
    """Tests for wasm/index.js content."""

    @pytest.fixture(autouse=True)
    def content(self):
        return read_js("wasm/index.js")

    def test_has_pythagorean_manifold(self, content):
        assert "class PythagoreanManifold" in content
        assert "_generateLattice" in content

    def test_has_kdtree(self, content):
        assert "class KDTree" in content
        assert "_buildTree" in content

    def test_has_dodecet_encoder(self, content):
        assert "class DodecetEncoder" in content
        assert "_jsEncode" in content
        assert "_jsDecode" in content

    def test_has_utility_functions(self, content):
        assert "computeHiddenDimensions" in content
        assert "computeHolographicAccuracy" in content


class TestAPIHealthJS:
    """Tests for api/health.js content."""

    @pytest.fixture(autouse=True)
    def content(self):
        return read_js("api/health.js")

    def test_has_health_routes(self, content):
        assert "/live" in content
        assert "/ready" in content

    def test_has_subsystem_checks(self, content):
        assert "checkWasm" in content
        assert "checkStaticAssets" in content
        assert "checkKV" in content
        assert "checkMemory" in content

    def test_returns_json_responses(self, content):
        assert "Content-Type" in content
        assert "application/json" in content


class TestHTMLIndex:
    """Tests for index.html content."""

    @pytest.fixture(autouse=True)
    def content(self):
        with open(os.path.join(ROOT, "index.html")) as f:
            return f.read()

    def test_has_title(self, content):
        assert "<title>" in content

    def test_references_css(self, content):
        # CSS may be inline <style> or linked .css
        assert "<style" in content or ".css" in content

    def test_references_js(self, content):
        # JS may be inline <script> or linked .js
        assert "<script" in content or ".js" in content


def _get_experiment_names():
    exp_dir = os.path.join(ROOT, "experiments")
    return sorted([
        name
        for name in os.listdir(exp_dir)
        if os.path.isdir(os.path.join(exp_dir, name))
    ])


class TestExperimentApps:
    """Validate each experiment's app.js has basic structure."""

    @pytest.mark.parametrize("name", _get_experiment_names())
    def test_app_js_has_init_or_setup(self, name):
        path = os.path.join(ROOT, "experiments", name, "app.js")
        with open(path) as f:
            content = f.read()
        # Each app should have some initialization
        has_init = bool(
            re.search(r"(function\s+init|addEventListener|DOMContentLoaded|window\.onload|class\s+\w+)", content)
        )
        assert has_init, f"Experiment '{name}' app.js has no init/setup pattern"

    @pytest.mark.parametrize("name", _get_experiment_names())
    def test_app_js_not_trivially_small(self, name):
        path = os.path.join(ROOT, "experiments", name, "app.js")
        size = os.path.getsize(path)
        assert size > 100, f"Experiment '{name}' app.js is suspiciously small ({size} bytes)"
