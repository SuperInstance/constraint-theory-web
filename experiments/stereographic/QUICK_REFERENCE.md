# Stereographic Projection Simulator - Quick Reference

## Quick Start

1. Open `index.html` in a web browser
2. Click on the sphere to see the projected point on the plane
3. Adjust controls to explore different configurations

## Controls Overview

### Projection Settings
- **Projection Point Height** (0.5 - 2.0): Moves the north pole up/down
- **Sphere Radius** (0.5 - 1.5): Scales the sphere size

### Display Options
- **Latitude Lines**: Horizontal circles (blue)
- **Longitude Lines**: Vertical circles (darker blue)
- **Great Circles**: Additional great circles (pink)
- **Projection Line**: Shows ray from north pole through point (orange dashed)
- **Plane Grid**: Coordinate grid on plane view

### Grid Density
- **Grid Lines** (4 - 20): Number of latitude/longitude lines

### Rotation
- **Auto-rotation** (0 - 0.02): Automatic sphere rotation speed
- **Rotation Axis**: X, Y, or Z axis

### Animation
- **Animate Path**: Traces a figure-8 curve on sphere and plane
- **Reset View**: Returns to default orientation
- **Clear Point**: Removes selected point

## Mouse Interaction

### Sphere Canvas
- **Click**: Select point and show its projection
- **Drag**: Rotate the sphere manually

### Plane Canvas
- **Click**: Select point and show its pre-image on sphere

## Color Coding

- **Blue (#2196F3)**: Sphere outline
- **Light Blue (#1976D2)**: Latitude lines
- **Dark Blue (#1565C0)**: Longitude lines
- **Pink (#E91E63)**: Great circles
- **Orange (#FF9800)**: Projection line and north pole
- **Red-Orange (#FF5722)**: Selected/animated points
- **Dark Grey (#37474F)**: Grid lines

## Key Concepts

### Conformal Property
Angles are preserved! If two curves intersect at angle θ on the sphere, their projections intersect at the same angle θ on the plane.

### Circle-Preserving
- Circles on sphere → Circles on plane
- Exception: Circles through north pole → Lines on plane
- Lines are "circles through infinity"

### Projection Formula
```
Sphere → Plane:
X = x / (1 - z)
Y = y / (1 - z)

Plane → Sphere:
x = 2X / (1 + X² + Y²)
y = 2Y / (1 + X² + Y²)
z = (X² + Y² - 1) / (1 + X² + Y²)
```

### Special Points
- **North Pole (0, 1, 0)**: Projects to infinity
- **South Pole (0, -1, 0)**: Projects to origin (0, 0)
- **Equator (z = 0)**: Projects to unit circle

## Constraint Theory Connections

1. **Geometric Constraints**: The projection is a constraint mapping 3D → 2D
2. **Deterministic**: Each point maps to exactly one point
3. **Conformal**: Preserves angles (constraint satisfaction property)
4. **Space Transformation**: Shows how constraints change geometry

## Tips for Exploration

1. **Start Simple**: Enable only latitude lines to see basic structure
2. **Add Complexity**: Gradually enable longitude and great circles
3. **Watch Animation**: See how curves map between spaces
4. **Test Points**: Click points at different latitudes to see scaling
5. **Observe Conformal**: Notice how perpendicular intersections remain perpendicular

## Common Observations

### Near North Pole
- Small movements on sphere → Large movements on plane
- Demonstrates projection singularity

### Near South Pole
- Small movements on sphere → Small movements on plane
- Projection is well-behaved

### At Equator
- Points map to unit circle
- Interior of sphere → Interior of unit circle
- Exterior of sphere → Exterior of unit circle

## Browser Requirements

- Modern browser with Canvas 2D support
- JavaScript enabled
- CSS Grid and Flexbox support

## File Structure

```
stereographic/
├── index.html      # Main HTML (178 lines)
├── app.js          # Simulation logic (660 lines)
├── style.css       # Dark theme styling (410 lines)
├── README.md       # Full documentation
└── QUICK_REFERENCE.md  # This file
```

## Keyboard Shortcuts

(Coming in future versions)
- `R`: Reset view
- `C`: Clear point
- `Space`: Toggle animation
- `G`: Toggle grid

## Troubleshooting

**Issue**: Can't click on sphere
**Solution**: Make sure you're clicking on the visible part of the sphere (not the empty space)

**Issue**: Point projects off-screen
**Solution**: Points near the north pole project to infinity. Try points lower on the sphere.

**Issue**: Animation looks jerky
**Solution**: Reduce rotation speed or close other browser tabs.

## Advanced Usage

### Custom Paths
Edit `app.js` and modify the `generateAnimationPath()` method to create custom curves.

### Color Themes
Edit `style.css` and modify the `colors` object in `app.js` for custom themes.

### Export
Use browser screenshot tools to capture visualizations for presentations.

---

**Created for**: Constraint Theory Research
**Location**: `C:\Users\casey\polln\constrainttheory\web\simulators\stereographic\`
**Last Updated**: 2026-03-19
