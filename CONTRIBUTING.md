# Contributing to Clinical Cortex

Thank you for your interest in contributing to **Clinical Cortex**! This document provides guidelines to help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/clinical_cortex.git
   cd clinical_cortex
   ```
3. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Follow the [Quick Start](README.md#-quick-start) guide to set up the development environment.

---

## Development Workflow

```
main ─────────────────────────────────────────►
  │
  └── feat/your-feature ──── PR ──── merge ──►
```

- Always branch from `main`
- Keep branches focused — one feature or fix per branch
- Rebase on `main` before opening a PR

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code formatting (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, CI, or tooling changes |

### Examples

```
feat(agents): add cardiac arrest risk predictor
fix(auth): resolve JWT token expiry race condition
docs(readme): update deployment instructions
test(safety): add edge-case tests for staleness detection
```

---

## Pull Request Process

1. **Update tests** — all new features must include tests
2. **Update documentation** — reflect any API or config changes
3. **Run the full test suite** and ensure it passes:
   ```bash
   cd backend && pytest app/tests/ -v
   ```
4. **Fill out the PR template** with:
   - What the change does
   - Why it's needed
   - How to test it
5. **Request a review** from at least one maintainer
6. **Squash commits** before merging if the branch has noisy history

---

## Coding Standards

### Python (Backend)

- **Formatter**: Follow PEP 8
- **Type hints**: Use type annotations for all function signatures
- **Docstrings**: Google-style docstrings for public functions and classes
- **Async**: Use `async/await` for all I/O-bound operations
- **Imports**: Group stdlib → third-party → local, separated by blank lines

### JavaScript/React (Frontend)

- **Components**: Functional components with hooks only
- **Naming**: PascalCase for components, camelCase for utilities
- **Styling**: Tailwind CSS utility classes
- **State**: React Context for global state, `useState`/`useReducer` for local

---

## Testing

### Backend

```bash
cd backend

# Run all tests
pytest app/tests/ -v

# With coverage report
pytest app/tests/ --cov=app --cov-report=html

# Run a specific test file
pytest app/tests/test_safety_layer.py -v
```

### Frontend

```bash
cd frontend
npm test          # (when test runner is configured)
```

### What to Test

- **Agents**: Input/output contracts, edge cases, error handling
- **Services**: Business logic, notification dispatch, audit logging
- **Routers**: HTTP status codes, request validation, auth guards
- **Safety Layer**: Boundary conditions, data completeness thresholds

---

## Reporting Issues

Use [GitHub Issues](../../issues) with the following labels:

| Label | Use for |
|-------|---------|
| `bug` | Something is broken |
| `enhancement` | New feature request |
| `docs` | Documentation improvement |
| `question` | General question |
| `security` | Security concern (see [SECURITY.md](SECURITY.md)) |

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Environment**
- OS: [e.g., Windows 11, Ubuntu 22.04]
- Python: [e.g., 3.10.12]
- Node.js: [e.g., 18.17.0]
- Browser: [e.g., Chrome 120]
```

---

Thank you for helping improve Clinical Cortex! 🧠
