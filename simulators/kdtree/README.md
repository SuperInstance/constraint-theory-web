# KD-Tree Visualization Simulator

**Location:** `C:\Users\casey\polln\constrainttheory\web\simulators\kdtree\`

Interactive visualization of KD-Tree spatial partitioning for O(log n) range queries and nearest-neighbor search.

## Features

### Core Functionality
- **Point Management**: Add random points or click to place individual points
- **Tree Construction**: Build KD-Tree with instant or step-by-step animation
- **Nearest Neighbor Search**: Visual O(log n) search with path highlighting
- **Range Query**: Rectangular range search with result highlighting
- **Interactive Controls**: Adjustable animation speed, pause/resume

### Visual Features
- **Splitting Lines**: Alternating vertical (blue) and horizontal (purple) splits
- **Glowing Points**: Radial gradient glow effect for all points
- **Search Results**: Bright green highlighting for found points
- **Range Overlay**: Semi-transparent blue region for range queries
- **Depth-Based Coloring**: Warm colors for shallow nodes, cool for deep
- **Smooth Animations**: Configurable speed for build and search operations

### Statistics Panel
- **Points**: Total number of points in the dataset
- **Tree Nodes**: Number of nodes in the KD-Tree
- **Max Depth**: Maximum depth of the tree structure
- **Comparisons**: Number of comparisons made during queries

## How to Use

### 1. Add Points
- Click "Add 10 Random Points" for quick testing
- Click "Add 50 Random Points" for larger datasets
- Click directly on the canvas to place individual points

### 2. Build Tree
- **Build Tree**: Instant construction of the KD-Tree
- **Step-by-Step Build**: Animated construction showing each split
- **Reset Tree**: Clear the tree while keeping points

### 3. Query Operations
- **Nearest Neighbor**: Click button, then click on canvas to find nearest point
- **Range Query**: Click button, then click on canvas to search region
- **Clear Query**: Remove query results and highlighting

### 4. Animation Control
- **Speed Slider**: Adjust animation speed (10ms - 200ms)
- **Pause/Resume**: Toggle animation playback

## Technical Details

### KD-Tree Algorithm
```
Build(points, depth):
    if points is empty: return null
    axis = depth mod k (k=2 for 2D)
    sort points by axis
    median = points[length/2]
    node = Node(median, axis)
    node.left = Build(points[0:median], depth+1)
    node.right = Build(points[median+1:], depth+1)
    return node
```

### Time Complexity
- **Build**: O(n log n) average, O(n²) worst case
- **Nearest Neighbor**: O(log n) average
- **Range Query**: O(n^(1-1/k) + m) where m is results found

### Space Complexity
- **Tree Storage**: O(n)
- **Recursion Stack**: O(log n) average

## File Structure

```
kdtree/
├── index.html    # Main page with canvas and controls
├── app.js        # Core simulation logic
├── style.css     # Dark theme styling
└── README.md     # This file
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design supported

## Integration with Constraint Theory

This simulator demonstrates:
1. **Spatial Partitioning**: Core concept for geometric constraint solving
2. **FPS Paradigm**: Each agent queries only nearby points via spatial indexing
3. **O(log n) Queries**: Efficient spatial queries for multi-agent coordination
4. **Geometric Substrate**: Foundation for cellular agent infrastructure

## Performance

- **Recommended Points**: 10-100 for clear visualization
- **Maximum Points**: 500+ (animation may slow down)
- **Canvas Size**: 800x600 pixels (responsive)

## Future Enhancements

- [ ] 3D visualization for 3D KD-Trees
- [ ] Performance benchmarking mode
- [ ] Export tree structure as JSON
- [ ] Import custom point datasets
- [ ] Tree balancing visualization
- [ ] Comparison with other spatial indices (R-tree, Quad-tree)

## Links

- **Live Demo**: https://constraint-theory.superinstance.ai/simulators/kdtree/
- **Main Project**: https://constraint-theory.superinstance.ai
- **GitHub**: https://github.com/SuperInstance/constrainttheory

## License

Part of the Constraint Theory project - See main repository for license information.
