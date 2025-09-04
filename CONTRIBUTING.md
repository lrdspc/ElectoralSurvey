# Contributing to ElectoralSurvey

Thank you for your interest in contributing to ElectoralSurvey! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Development Environment Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/ElectoralSurvey.git
   cd ElectoralSurvey
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local development settings
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git
- A Cloudflare account (for backend development)

## 📝 Contribution Workflow

### 1. Issue Discussion

Before starting work:
- Check existing [issues](https://github.com/lrdspc/ElectoralSurvey/issues)
- Create a new issue for bugs or feature requests
- Discuss major changes with maintainers

### 2. Branch Creation

Create a feature branch from `main`:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 3. Development Guidelines

#### Code Style

- Use TypeScript for all new code
- Follow the existing code formatting (Prettier configuration)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

#### File Organization

```
src/
├── react-app/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route-based pages
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # React contexts
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions
├── shared/            # Shared utilities and types
└── worker/            # Cloudflare Workers
    ├── handlers/      # Request handlers
    ├── services/      # Business logic
    └── utils/         # Worker utilities
```

### 4. Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(survey): add offline sync for survey responses"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs(readme): update installation instructions"
```

### 5. Testing

#### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

#### Test Requirements

- **Unit tests**: All new features must include unit tests
- **Integration tests**: API endpoints and database operations
- **E2E tests**: Critical user workflows
- **Coverage**: Maintain minimum 80% code coverage

#### Writing Tests

```typescript
// Example test structure
describe('SurveyService', () => {
  describe('createSurvey', () => {
    it('should create a new survey with valid data', async () => {
      // Test implementation
    });

    it('should throw error with invalid data', async () => {
      // Test implementation
    });
  });
});
```

### 6. Pull Request Process

#### Before Creating PR

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Run quality checks**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

4. **Update CHANGELOG.md** for significant changes

#### PR Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No breaking changes (or documented)
```

#### Review Process

1. **Automated checks** must pass
2. **Code review** by at least one maintainer
3. **Testing** on different environments
4. **Approval** before merge

## 🐛 Bug Reports

### Bug Report Template

When reporting bugs, include:

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js version: [e.g., 18.17.0]
- App version: [e.g., 1.2.0]

**Screenshots**
If applicable, add screenshots

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the proposed feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this be implemented?

**Alternatives Considered**
Other approaches considered

**Additional Context**
Screenshots, examples, or use cases
```

## 📋 Code Review Guidelines

### For Contributors

- **Self-review** your code before requesting review
- **Respond promptly** to feedback
- **Be open** to suggestions and changes
- **Test thoroughly** on different environments

### For Reviewers

- **Be constructive** and specific in feedback
- **Test the changes** locally when possible
- **Consider performance** and security implications
- **Check documentation** and tests

## 🔧 Development Tips

### Performance Optimization

- Use React.memo for expensive components
- Implement proper caching strategies
- Optimize bundle size with code splitting
- Monitor Core Web Vitals

### Security Best Practices

- Never commit secrets or API keys
- Validate all user inputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

### Database Guidelines

- Use migrations for schema changes
- Index frequently queried fields
- Implement proper error handling
- Use transactions for atomic operations

## 🌟 Recognition

Contributors are recognized in several ways:

- **GitHub contributors** list
- **CHANGELOG.md** acknowledgments
- **Release notes** mentions
- **Community highlights** in Discord

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: [Join our server](https://discord.gg/shDEGBSe2d)
- **Email**: maintainers@electoral-survey.com

### Resources

- **Documentation**: [Project Wiki](https://github.com/lrdspc/ElectoralSurvey/wiki)
- **API Reference**: [API Documentation](https://github.com/lrdspc/ElectoralSurvey/blob/main/API.md)
- **Architecture**: [Architecture Guide](https://github.com/lrdspc/ElectoralSurvey/blob/main/ARCHITECTURE.md)

## 📄 License

By contributing to ElectoralSurvey, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ElectoralSurvey! 🎉