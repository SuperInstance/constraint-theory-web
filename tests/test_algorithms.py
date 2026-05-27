"""Tests for Python re-implementations of core algorithms from the JS codebase.

These validate the same logic used in wasm/index.js and js/main.js.
"""

import math

import pytest


# --- Pythagorean Manifold (from wasm/index.js PythagoreanManifold) ---

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a


def generate_pythagorean_lattice(max_hyp):
    """Port of PythagoreanManifold._generateLattice from wasm/index.js."""
    lattice = []
    for m in range(2, int(math.sqrt(max_hyp)) + 1):
        for n in range(1, m):
            if (m - n) % 2 == 1 and gcd(m, n) == 1:
                a = m * m - n * n
                b = 2 * m * n
                c = m * m + n * n
                if c <= max_hyp:
                    lattice.append({"x": a / c, "y": b / c, "a": a, "b": b, "c": c})
                    lattice.append({"x": b / c, "y": a / c, "a": b, "b": a, "c": c})
    return lattice


def snap_to_lattice(px, py, lattice):
    """Port of PythagoreanManifold._jsSnap."""
    best = None
    min_dist = float("inf")
    for pt in lattice:
        dist = math.hypot(px - pt["x"], py - pt["y"])
        if dist < min_dist:
            min_dist = dist
            best = pt
    return {"exact": [best["x"], best["y"]], "noise": min_dist, "triple": (best["a"], best["b"], best["c"])}


def within_radius(cx, cy, radius, lattice):
    """Port of PythagoreanManifold._jsWithinRadius."""
    return [{"x": pt["x"], "y": pt["y"]} for pt in lattice if math.hypot(pt["x"] - cx, pt["y"] - cy) <= radius]


class TestPythagoreanManifold:
    def test_generates_lattice(self):
        lattice = generate_pythagorean_lattice(200)
        assert len(lattice) > 0

    def test_known_triples_present(self):
        lattice = generate_pythagorean_lattice(200)
        triples = {(pt["a"], pt["b"], pt["c"]) for pt in lattice}
        # 3-4-5
        assert (3, 4, 5) in triples or (4, 3, 5) in triples
        # 5-12-13
        assert (5, 12, 13) in triples or (12, 5, 13) in triples

    def test_all_points_on_unit_circle(self):
        lattice = generate_pythagorean_lattice(200)
        for pt in lattice:
            # a² + b² = c²  =>  (a/c)² + (b/c)² = 1
            assert abs(pt["x"] ** 2 + pt["y"] ** 2 - 1.0) < 1e-10

    def test_snap_finds_closest(self):
        lattice = generate_pythagorean_lattice(200)
        # Snap a point near 3/5, 4/5 (= 0.6, 0.8)
        result = snap_to_lattice(0.61, 0.79, lattice)
        assert abs(result["exact"][0] - 0.6) < 0.05
        assert abs(result["exact"][1] - 0.8) < 0.05

    def test_within_radius(self):
        lattice = generate_pythagorean_lattice(200)
        pts = within_radius(0.6, 0.8, 0.1, lattice)
        assert len(pts) >= 1  # At least (0.6, 0.8) itself

    def test_snap_noise_is_small_for_known_point(self):
        lattice = generate_pythagorean_lattice(200)
        result = snap_to_lattice(0.6, 0.8, lattice)
        assert result["noise"] < 0.01


# --- Dodecet Encoder (from wasm/index.js DodecetEncoder) ---

def dodecet_encode(orientation):
    """Port of DodecetEncoder._jsEncode."""
    value = int(orientation * 4096) & 0xFFF
    return {
        "value": value,
        "hex": "0x" + format(value, "03X"),
        "bits": [int(b) for b in format(value, "012b")],
    }


def dodecet_decode(dodecet):
    """Port of DodecetEncoder._jsDecode."""
    value = dodecet["value"] if isinstance(dodecet, dict) else dodecet
    return value / 4096


class TestDodecetEncoder:
    def test_encode_zero(self):
        result = dodecet_encode(0.0)
        assert result["value"] == 0
        assert result["hex"] == "0x000"
        assert result["bits"] == [0] * 12

    def test_encode_max(self):
        result = dodecet_encode(1.0)
        # 1.0 * 4096 = 4096, & 0xFFF = 0
        assert result["value"] == 0  # wraps around

    def test_encode_half(self):
        result = dodecet_encode(0.5)
        assert result["value"] == 2048
        assert result["hex"] == "0x800"

    def test_roundtrip(self):
        for val in [0.0, 0.25, 0.5, 0.75, 0.999]:
            encoded = dodecet_encode(val)
            decoded = dodecet_decode(encoded)
            assert abs(decoded - val) < 1 / 4096

    def test_bits_length(self):
        result = dodecet_encode(0.5)
        assert len(result["bits"]) == 12

    def test_hex_format(self):
        result = dodecet_encode(0.25)
        assert result["hex"].startswith("0x")
        assert len(result["hex"]) == 5  # "0x" + 3 hex digits


# --- Utility Functions (from wasm/index.js) ---

def compute_hidden_dimensions(epsilon):
    """Port of computeHiddenDimensions."""
    return math.ceil(math.log2(1 / epsilon))


def compute_holographic_accuracy(k, n):
    """Port of computeHolographicAccuracy."""
    return k / n + 1 / math.log(n + 1)


class TestComputeHiddenDimensions:
    def test_small_epsilon(self):
        result = compute_hidden_dimensions(0.001)
        assert result == math.ceil(math.log2(1000))

    def test_large_epsilon(self):
        result = compute_hidden_dimensions(0.5)
        assert result == 1

    def test_exact_power_of_two(self):
        result = compute_hidden_dimensions(1 / 256)
        assert result == 8


class TestComputeHolographicAccuracy:
    def test_basic(self):
        acc = compute_holographic_accuracy(5, 10)
        expected = 5 / 10 + 1 / math.log(11)
        assert abs(acc - expected) < 1e-10

    def test_higher_k_higher_accuracy(self):
        acc1 = compute_holographic_accuracy(2, 10)
        acc2 = compute_holographic_accuracy(8, 10)
        assert acc2 > acc1


# --- Validate Number (from js/main.js) ---

class TestValidateNumber:
    """Test the logic from validateNumber in js/main.js."""

    @staticmethod
    def validate_number(value, min_val=-float("inf"), max_val=float("inf"), allow_nan=False, allow_inf=False):
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ValueError(f"value must be a number, got {type(value).__name__}")
        if not allow_nan and math.isnan(value):
            raise ValueError("value cannot be NaN")
        if not allow_inf and not math.isfinite(value):
            raise ValueError(f"value must be finite, got {value}")
        if value < min_val or value > max_val:
            raise ValueError(f"value must be between {min_val} and {max_val}, got {value}")
        return True

    def test_valid_int(self):
        assert self.validate_number(5) is True

    def test_valid_float(self):
        assert self.validate_number(3.14) is True

    def test_invalid_string(self):
        with pytest.raises(ValueError):
            self.validate_number("5")

    def test_invalid_bool(self):
        with pytest.raises(ValueError):
            self.validate_number(True)

    def test_nan_rejected(self):
        with pytest.raises(ValueError):
            self.validate_number(float("nan"))

    def test_nan_allowed(self):
        assert self.validate_number(float("nan"), allow_nan=True, allow_inf=True) is True

    def test_inf_rejected(self):
        with pytest.raises(ValueError):
            self.validate_number(float("inf"))

    def test_inf_allowed(self):
        assert self.validate_number(float("inf"), allow_inf=True) is True

    def test_min_bound(self):
        assert self.validate_number(5, min_val=0) is True
        with pytest.raises(ValueError):
            self.validate_number(-1, min_val=0)

    def test_max_bound(self):
        assert self.validate_number(5, max_val=10) is True
        with pytest.raises(ValueError):
            self.validate_number(15, max_val=10)

    def test_range(self):
        assert self.validate_number(5, min_val=0, max_val=10) is True
        with pytest.raises(ValueError):
            self.validate_number(11, min_val=0, max_val=10)


# --- KD-Tree (from wasm/index.js KDTree) ---

class KDNode:
    def __init__(self, point, left, right, axis):
        self.point = point
        self.left = left
        self.right = right
        self.axis = axis


def build_kdtree(points, depth=0):
    if not points:
        return None
    axis = depth % 2
    key = "x" if axis == 0 else "y"
    points = sorted(points, key=lambda p: p[key])
    mid = len(points) // 2
    return KDNode(
        point=points[mid],
        left=build_kdtree(points[:mid], depth + 1),
        right=build_kdtree(points[mid + 1:], depth + 1),
        axis=axis,
    )


def kd_nearest(node, point, best=None, best_dist=float("inf")):
    if node is None:
        return best, best_dist
    dist = math.hypot(point["x"] - node.point["x"], point["y"] - node.point["y"])
    if dist < best_dist:
        best = node.point
        best_dist = dist
    key = "x" if node.axis == 0 else "y"
    diff = point[key] - node.point[key]
    near = node.left if diff < 0 else node.right
    far = node.right if diff < 0 else node.left
    best, best_dist = kd_nearest(near, point, best, best_dist)
    if abs(diff) < best_dist:
        best, best_dist = kd_nearest(far, point, best, best_dist)
    return best, best_dist


def kd_range(points, min_x, max_x, min_y, max_y):
    return [p for p in points if min_x <= p["x"] <= max_x and min_y <= p["y"] <= max_y]


class TestKDTree:
    @pytest.fixture
    def points(self):
        return [
            {"x": 2, "y": 3},
            {"x": 5, "y": 4},
            {"x": 9, "y": 6},
            {"x": 4, "y": 7},
            {"x": 8, "y": 1},
            {"x": 7, "y": 2},
        ]

    def test_nearest_neighbor(self, points):
        tree = build_kdtree(list(points))
        best, dist = kd_nearest(tree, {"x": 6, "y": 3})
        assert best == {"x": 5, "y": 4} or best == {"x": 7, "y": 2}

    def test_exact_match(self, points):
        tree = build_kdtree(list(points))
        best, dist = kd_nearest(tree, {"x": 9, "y": 6})
        assert best == {"x": 9, "y": 6}
        assert dist == 0

    def test_range_query(self, points):
        result = kd_range(points, 4, 8, 1, 5)
        assert {"x": 5, "y": 4} in result
        assert {"x": 7, "y": 2} in result
        assert {"x": 8, "y": 1} in result
        assert {"x": 9, "y": 6} not in result

    def test_empty_points(self):
        tree = build_kdtree([])
        assert tree is None

    def test_single_point(self):
        tree = build_kdtree([{"x": 1, "y": 1}])
        best, dist = kd_nearest(tree, {"x": 5, "y": 5})
        assert best == {"x": 1, "y": 1}
