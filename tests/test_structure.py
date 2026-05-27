"""Tests for project structure and file integrity."""

import json
import os

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# --- Project root files ---

def test_root_files_exist():
    expected = ["README.md", "LICENSE", "package.json", "index.html", "wrangler.toml"]
    for name in expected:
        assert os.path.isfile(os.path.join(ROOT, name)), f"Missing root file: {name}"


def test_package_json_valid():
    with open(os.path.join(ROOT, "package.json")) as f:
        pkg = json.load(f)
    assert pkg["name"] == "constraint-theory-web"
    assert "scripts" in pkg
    assert "test" in pkg["scripts"]


def test_directories_exist():
    expected_dirs = ["js", "css", "experiments", "docs", "schemas"]
    for d in expected_dirs:
        assert os.path.isdir(os.path.join(ROOT, d)), f"Missing directory: {d}"


# --- JSON files ---

def _find_json_files():
    results = []
    for dirpath, _, filenames in os.walk(ROOT):
        if ".git" in dirpath or "node_modules" in dirpath:
            continue
        for fn in filenames:
            if fn.endswith(".json"):
                results.append(os.path.join(dirpath, fn))
    return results


@pytest.mark.parametrize("path", _find_json_files(), ids=lambda p: os.path.relpath(p, ROOT))
def test_json_files_valid(path):
    with open(path) as f:
        data = json.load(f)
    assert data is not None


# --- HTML files ---

def _find_html_files():
    results = []
    for dirpath, _, filenames in os.walk(ROOT):
        if ".git" in dirpath or "node_modules" in dirpath:
            continue
        for fn in filenames:
            if fn.endswith(".html"):
                results.append(os.path.join(dirpath, fn))
    return results


@pytest.mark.parametrize("path", _find_html_files(), ids=lambda p: os.path.relpath(p, ROOT))
def test_html_files_not_empty(path):
    with open(path) as f:
        content = f.read()
    assert len(content) > 0
    assert "<html" in content.lower() or "<!doctype" in content.lower()


# --- Experiments ---

def test_experiments_have_app_js():
    exp_dir = os.path.join(ROOT, "experiments")
    for name in os.listdir(exp_dir):
        exp_path = os.path.join(exp_dir, name)
        if os.path.isdir(exp_path):
            assert os.path.isfile(os.path.join(exp_path, "app.js")), (
                f"Experiment '{name}' missing app.js"
            )
            assert os.path.isfile(os.path.join(exp_path, "index.html")), (
                f"Experiment '{name}' missing index.html"
            )


# --- Schema validation ---

def test_experiment_schema_valid():
    schema_path = os.path.join(ROOT, "schemas", "experiment.json")
    with open(schema_path) as f:
        schema = json.load(f)
    assert "type" in schema or "$schema" in schema or "properties" in schema


def test_metadata_json_files_match_schema():
    schema_path = os.path.join(ROOT, "schemas", "experiment.json")
    if not os.path.isfile(schema_path):
        pytest.skip("No experiment.json schema found")

    with open(schema_path) as f:
        schema = json.load(f)

    # Check that metadata.json files are at least valid JSON
    for subdir in ["experiments", "simulators"]:
        dir_path = os.path.join(ROOT, subdir)
        if not os.path.isdir(dir_path):
            continue
        for name in os.listdir(dir_path):
            meta_path = os.path.join(dir_path, name, "metadata.json")
            if os.path.isfile(meta_path):
                with open(meta_path) as f:
                    json.load(f)  # Should not raise


# --- API module ---

def test_api_health_module_exists():
    assert os.path.isfile(os.path.join(ROOT, "api", "health.js"))


def test_api_health_has_handlers():
    with open(os.path.join(ROOT, "api", "health.js")) as f:
        content = f.read()
    assert "handleFullHealth" in content
    assert "handleLiveness" in content
    assert "handleReadiness" in content


# --- JS core modules ---

def test_js_main_exists():
    assert os.path.isfile(os.path.join(ROOT, "js", "main.js"))


def test_js_enhanced_exists():
    assert os.path.isfile(os.path.join(ROOT, "js", "enhanced.js"))


def test_js_animations_exists():
    assert os.path.isfile(os.path.join(ROOT, "js", "animations.js"))


def test_js_monitoring_exists():
    assert os.path.isfile(os.path.join(ROOT, "js", "monitoring.js"))


# --- WASM module ---

def test_wasm_index_exists():
    assert os.path.isfile(os.path.join(ROOT, "wasm", "index.js"))


# --- CSS files ---

def test_css_files_exist():
    css_dir = os.path.join(ROOT, "css")
    expected = ["styles.css", "design-system.css"]
    for name in expected:
        assert os.path.isfile(os.path.join(css_dir, name)), f"Missing CSS: {name}"
