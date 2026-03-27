# Stereographic Projection Simulator

An interactive visualization of stereographic projection from a sphere to a plane - a fundamental concept in geometric constraint theory, complex analysis, and hyperbolic geometry.

## What is Stereographic Projection?

Stereographic projection is a conformal mapping that projects points from a sphere onto a plane from a single fixed point (called the "projection point" or "north pole"). It has several remarkable properties:

### Key Properties

1. **Conformal**: Preserves angles between curves
2. **Circle-Preserving**: Circles on the sphere map to circles on the plane (or lines, which are circles through infinity)
3. **Bijective**: One-to-one correspondence between all points on the sphere (except the projection point) and all points on the plane
4. **Smooth**: Infinitely differentiable

### Mathematical Formula

For a point (x, y, z) on the unit sphere, the stereographic projection to the plane is:

```
X = x / (1 - z)
Y = y / (1 - z)
```

The inverse projection (plane to sphere) is:

```
x = 2X / (1 + X² + Y²)
y = 2Y / (1 + X² + Y²)
z = (X² + Y² - 1) / (1 + X² + Y²)
```

## Features

### Interactive Visualization

- **Dual Canvas Display**: View both the sphere (3D) and plane (2D projection) simultaneously
- **Click-to-Project**: Click on either canvas to see the corresponding point on the other view
- **Real-time Projection Line**: See the projection ray from the north pole through the selected point
- **Animated Path Tracing**: Watch points trace curves and their projected images

### Customization Options

- **Projection Point Height**: Adjust the position of the projection point
- **Sphere Radius**: Scale the sphere size
- **Grid Density**: Control the number of latitude/longitude lines
- **Auto-Rotation**: Automatically rotate the sphere for better 3D perception
- **Rotation Axis**: Choose X, Y, or Z axis rotation

### Display Controls

- **Latitude Lines**: Show horizontal circles on the sphere
- **Longitude Lines**: Show vertical circles on the sphere
- **Great Circles**: Display great circles and their projections
- **Projection Line**: Toggle the visibility of the projection ray
- **Plane Grid**: Show a coordinate grid on the plane

## Usage

1. **Open the Simulator**: Open `index.html` in a modern web browser

2. **Explore the Mapping**:
   - Click anywhere on the sphere canvas to see its projection on the plane
   - Click anywhere on the plane canvas to find its pre-image on the sphere
   - Observe how circles on the sphere map to circles on the plane

3. **Adjust Parameters**:
   - Use sliders to change projection height, sphere radius, and grid density
   - Toggle various display options to focus on specific features
   - Enable auto-rotation to better understand the 3D structure

4. **Animate**:
   - Click "Animate Path on Sphere" to see a curve traced on both views
   - Watch how the curve's projection moves on the plane

5. **Reset**: Use "Reset View" to return to default orientation and "Clear Point" to remove the selected point

## Technical Implementation

- **Pure HTML/CSS/JavaScript**: No external dependencies required
- **Canvas 2D API**: Used for both 3D sphere rendering (with manual projection) and 2D plane display
- **Manual 3D Projection**: Custom rotation and projection mathematics
- **Real-time Interaction**: Immediate visual feedback for all controls

## Constraint Theory Connection

Stereographic projection demonstrates several key concepts in constraint theory:

1. **Geometric Constraints**: The projection itself is a geometric constraint that maps one space to another
2. **Conformal Mapping**: Shows how constraint satisfaction can preserve certain properties (angles) while changing others (distances)
3. **Space Transformation**: Illustrates how constraint satisfaction can transform the geometry of a space
4. **Deterministic Mapping**: Each point on the sphere has exactly one corresponding point on the plane (deterministic constraint)

## Educational Applications

- **Complex Analysis**: Visualize the Riemann sphere and complex plane mapping
- **Hyperbolic Geometry**: Understand the Poincaré disk model
- **Cartography**: Learn about map projections and their properties
- **Topology**: Explore concepts of continuity and bijections

## Files

- `index.html` - Main HTML structure
- `app.js` - Core simulation logic and rendering
- `style.css` - Dark theme styling
- `README.md` - This file

## Browser Compatibility

Works on all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- CSS Grid and Flexbox

Tested on: Chrome, Firefox, Safari, Edge

## Future Enhancements

Potential additions:
- Preset paths (circles, spirals, Lissajous curves)
- Export animation as video
- Multiple projection points
- Different projection types (gnomonic, orthographic)
- Parameter tracing (show how X, Y coordinates change as point moves)
- Conformal property visualization (show angle preservation)

## Credits

Created for the Constraint Theory research project.
Demonstrates geometric constraints and conformal mappings in cellular agent infrastructure.

---

**Constraint Theory Research**: https://github.com/SuperInstance/constrainttheory
