# Neural Network Topology Simulator

## Overview

This interactive simulator demonstrates the fundamental differences between **Traditional Neural Networks** and **Constraint Theory Geometric Networks**.

### Key Concept

**Traditional Neural Networks** use:
- Matrix multiplication for weighted sums
- Activation functions (sigmoid, ReLU, etc.)
- Gradient descent for learning
- Backpropagation with chain rule

**Constraint Theory Networks** use:
- Geometric constraint satisfaction
- Pythagorean snapping instead of activation
- Constraint optimization for learning
- Violation propagation instead of gradients

## Files

- **index.html** (8.7 KB) - Main interface with side-by-side network views
- **app.js** (32.2 KB) - Core simulation logic
- **style.css** (8.2 KB) - Dark theme with purple/cyan accents

## Features

### Network Architectures
- **Simple 3-Layer** (2-3-1) - Basic feedforward network
- **Deep 6-Layer** (2-4-4-4-4-1) - Deep network
- **Convolutional-like** - Local constraint connections
- **Recurrent-like** - Feedback constraints

### Training Problems
- **XOR** - Classic non-linear problem
- **AND** - Simple logical operation
- **OR** - Simple logical operation
- **Circle Classification** - Geometric classification

### Interactive Controls
- **Input Sliders** - Set input values (0.0 to 1.0)
- **Random Input** - Generate random binary input
- **Visualization Options**:
  - Show/Hide Weights/Constraints
  - Show/Hide Activations/Satisfaction
  - Show/Hide Gradient Flow
  - Animate Forward Pass

### Training Features
- **Train Step** - Single training step
- **Train Epoch** - Full epoch (4 training steps)
- **Auto Train** - Automatic training for 20 epochs
- **Reset Network** - Reset all weights/constraints

### Visual Elements
- **Traditional NN**: Blue/purple theme, circular nodes
- **Constraint NN**: Green/red theme, hexagonal nodes
- **Animated signals** flowing through connections
- **Real-time stats** (parameters, activations, violations)
- **Loss graph** comparing both approaches

## How to Use

1. **Open the Simulator**
   ```bash
   cd C:\Users\casey\polln\constrainttheory\web\simulators\neural-network
   # Open index.html in your browser
   ```

2. **Select Architecture**
   - Choose from the dropdown (Simple, Deep, Conv-like, Recurrent-like)

3. **Set Inputs**
   - Use sliders or click "Random Input"
   - Watch the forward pass animation

4. **Train the Network**
   - Select a problem (XOR, AND, OR, Circle)
   - Click "Train Step" or "Auto Train"
   - Watch the loss graph update

5. **Compare Approaches**
   - Left panel: Traditional Neural Network
   - Right panel: Constraint Theory Network
   - Observe differences in learning behavior

## Key Differences Visualized

### Neuron Representation
- **Traditional**: Circle with color intensity = activation value
- **Constraint**: Hexagon with color = constraint satisfaction

### Connections
- **Traditional**: Line thickness = weight magnitude
- **Constraint**: Color (green = satisfied, red = violated)

### Forward Pass
- **Traditional**: Weighted sum + activation function
- **Constraint**: Pythagorean snapping to geometric constraints

### Learning
- **Traditional**: Gradient descent updates weights
- **Constraint**: Constraint optimization adjusts distances/strengths

## Technical Details

### Traditional Neural Network
```javascript
// Forward pass
output = sigmoid(weight * input + bias)

// Backward pass
gradient = error * sigmoid_derivative(output)
weight += learning_rate * gradient
```

### Constraint Theory Network
```javascript
// Forward pass
snapped_value = pythagorean_snap(input, constraint)
satisfaction = 1.0 - |difference| / target

// Learning
constraint.distance += error * learning_rate * strength
```

## Performance Metrics

The simulator tracks:
- **Parameter/Constraint Count** - Total learnable parameters
- **Activation Sum** - Sum of all neuron activations
- **Gradient Flow** - Magnitude of gradient updates
- **Satisfaction Rate** - Percentage of satisfied constraints
- **Violation Count** - Number of violated constraints
- **Training Loss** - MSE loss over time

## Educational Goals

This simulator helps you understand:

1. **Geometric Intuition** - How constraints create geometric structures
2. **Learning Dynamics** - Different learning behaviors
3. **Network Architecture** - How topology affects computation
4. **Visualization** - Seeing neural networks as geometric objects
5. **Constraint Theory** - Practical application of geometric constraints

## Integration with Constraint Theory

This simulator demonstrates how:
- **Pythagorean Snapping** replaces activation functions
- **Geometric Constraints** replace weight matrices
- **Constraint Satisfaction** replaces gradient optimization
- **Violations** replace error signals

The Constraint Theory approach provides:
- **Geometric Interpretability** - Visible constraint relationships
- **Robustness** - Geometric invariants
- **Efficiency** - Local constraint satisfaction
- **Scalability** - Distributed constraint optimization

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design

## Future Enhancements

Potential additions:
- More network architectures (transformer-like, graph networks)
- More training problems (regression, multi-class)
- Export network parameters
- Import custom architectures
- 3D visualization of constraint space
- Real-time training metrics dashboard

## License

Part of the Constraint Theory research project.
