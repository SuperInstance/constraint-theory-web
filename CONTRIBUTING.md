# Contributing to Constraint Theory Web

Thank you for your interest in contributing to Constraint Theory Web!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/constraint-theory-web.git`
3. Create a branch: `git checkout -b feature/my-feature`

## Development Setup

### Prerequisites

- Node.js 18+ (optional, for development server)
- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Building and Testing

```bash
# No build step required! Just open index.html in a browser
# Or use a local server for development
python -m http.server 8000

# With Node.js
npm install
npm run dev  # Starts live-server
```

## Making Changes

### Branch Naming

- `feature/` - New features or simulations
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `style/` - Visual improvements

### Commit Messages

Follow conventional commits:

```
feat: add new particle physics simulation
fix: correct collision detection in swarm demo
docs: update README with new demos
style: improve dark mode colors
```

## Testing

### Running Tests

```bash
# Validate HTML and JSON
npm run validate

# Lint JavaScript
npm run lint

# Run all checks
npm test
```

### Browser Testing

Test your changes in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Pull Request Process

1. **Update Documentation**: Ensure relevant docs are updated
2. **Test Browsers**: Verify in multiple browsers
3. **Check Accessibility**: Ensure keyboard navigation works
4. **Submit PR**: Use the PR template

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tested in multiple browsers
- [ ] No new console errors
- [ ] Accessibility maintained

## Style Guidelines

### HTML

- Use semantic elements (`<main>`, `<article>`, `<section>`)
- Add ARIA attributes for accessibility
- Include `<meta name="viewport">` for mobile

### CSS

- Mobile-first responsive design
- Use CSS custom properties for theming
- Keep total CSS under 50KB per demo

### JavaScript

- Use ES6+ features
- Prefer `const` over `let`
- Add comments for complex algorithms
- Keep total JS under 100KB per demo

## Ways to Contribute

### 🐛 Report Bugs
- Use the [GitHub Issues](https://github.com/SuperInstance/constraint-theory-web/issues) page
- Include browser/device info, steps to reproduce, and screenshots

### 💡 Suggest Features
- Open an issue with the "enhancement" label
- Describe the feature and its educational value

### 🎨 Add New Simulations
1. Create new directory in `/simulators/` or `/experiments/`
2. Follow existing code patterns
3. Include metadata.json
4. Submit a pull request

## Educational Focus

All contributions should:
- Teach systems thinking concepts
- Be accessible to beginners
- Work without installation
- Load quickly (< 1MB total per demo)

## Questions?

- Open a [Discussion](https://github.com/SuperInstance/constraint-theory-web/discussions)
- Check existing [Issues](https://github.com/SuperInstance/constraint-theory-web/issues)

Thank you for contributing!
