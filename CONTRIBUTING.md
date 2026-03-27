# Contributing to Constraint Theory Web

Thank you for your interest in contributing to Constraint Theory Web! This project aims to make complex systems thinking accessible through interactive visualizations.

## Ways to Contribute

### 🐛 Report Bugs
- Use the [GitHub Issues](https://github.com/SuperInstance/constraint-theory-web/issues) page
- Include browser/device info, steps to reproduce, and screenshots

### 💡 Suggest Features
- Open an issue with the "enhancement" label
- Describe the feature and its educational value

### 🎨 Add New Simulations
1. Fork the repository
2. Create a new simulation in `/simulators/` or `/experiments/`
3. Follow the existing code patterns
4. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/constraint-theory-web.git
cd constraint-theory-web

# Open index.html in a browser (no build step required!)
# Or use a local server for development
python -m http.server 8000
```

## Code Style

- **HTML**: Semantic elements, accessible markup
- **CSS**: Mobile-first responsive design
- **JavaScript**: ES6+, modular functions, clear comments
- **No dependencies**: Keep it simple and lightweight

## Pull Request Process

1. Create a feature branch (`git checkout -b feature/amazing-simulation`)
2. Make your changes with clear commit messages
3. Test in multiple browsers
4. Update documentation if needed
5. Submit PR with description of changes

## Educational Focus

All contributions should:
- Teach systems thinking concepts
- Be accessible to beginners
- Work without installation
- Load quickly (< 1MB total)

## Questions?

Open an issue or reach out to the maintainers.

## License

By contributing, you agree your work will be licensed under the MIT License.