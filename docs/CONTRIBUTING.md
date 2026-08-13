# Contributing to Atomic Chat

Thank you for your interest in contributing to Atomic Chat! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

### Our Standards

- **Resful communication**: Use welcoming and inclusive language
- **Constructive feedback**: Focus on what is best for the community
- **Collaboration**: Work together to resolve conflicts
- **Empathy**: Be understanding of different perspectives and experiences

### Unacceptable Behavior

- Harassment, discriminatory language, or inappropriate content
- Personal attacks or insulting comments
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

## Getting Started

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/atomic-chat.git
   cd atomic-chat
   ```

3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/original-username/atomic-chat.git
   ```

### Set Up Development Environment

Follow the [Development Guide](DEVELOPMENT_GUIDE.md) to set up your local development environment.

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature branches
- **fix/***: Bug fix branches
- **hotfix/***: Urgent production fixes

### Creating a Feature Branch

```bash
# Ensure your main is up to date
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes following the coding standards
2. Write tests for new functionality
3. Update documentation as needed
4. Commit your changes with clear messages

### Syncing with Upstream

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch on upstream/main
git rebase upstream/main
```

## Coding Standards

### TypeScript/JavaScript

#### Naming Conventions

- **Variables and functions**: camelCase
- **Classes and interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Private members**: Prefix with underscore

```typescript
// Good
const userName = 'john';
function getUserData() { }
class UserService { }
const MAX_RETRIES = 3;
private _internalData: string;

// Bad
const UserName = 'john';
function get_user_data() { }
class userService { }
const maxRetries = 3;
```

#### Code Organization

```typescript
// 1. Imports
import { useState } from 'react';
import { api } from './services/api';

// 2. Type definitions
interface Props {
  title: string;
}

// 3. Constants
const DEFAULT_VALUE = 'default';

// 4. Component/function
export function MyComponent({ title }: Props) {
  // 5. Hooks
  const [state, setState] = useState();
  
  // 6. Event handlers
  const handleClick = () => { };
  
  // 7. Effects
  useEffect(() => { }, []);
  
  // 8. Helper functions
  const helper = () => { };
  
  // 9. Render
  return <div>{title}</div>;
}
```

#### Error Handling

```typescript
// Good - specific error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof NetworkError) {
    handleNetworkError(error);
  } else if (error instanceof ValidationError) {
    handleValidationError(error);
  } else {
    throw new Error('Unexpected error');
  }
}

// Bad - generic error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error(error);
}
```

### React

#### Component Structure

```typescript
// Good - clear separation of concerns
interface Props {
  data: UserData;
  onUpdate: (id: string) => void;
}

export default function UserCard({ data, onUpdate }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpdate = useCallback(() => {
    setIsLoading(true);
    onUpdate(data.id);
  }, [data.id, onUpdate]);
  
  return (
    <div className="user-card">
      <h2>{data.name}</h2>
      <button onClick={handleUpdate} disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update'}
      </button>
    </div>
  );
}

// Bad - mixed concerns
export default function UserCard({ data }: any) {
  const handleClick = async () => {
    const response = await fetch('/api/update');
    const result = await response.json();
    // API call should be in service layer
  };
  
  return <div>{data.name}</div>;
}
```

#### Hooks Usage

```typescript
// Good - proper dependency arrays
useEffect(() => {
  fetchData();
}, [userId]); // Only re-run when userId changes

// Bad - missing dependencies
useEffect(() => {
  fetchData();
}, []); // Missing userId dependency
```

### CSS

#### Styling Conventions

```css
/* Good - BEM methodology */
.message-input {
  display: flex;
}

.message-input__field {
  flex: 1;
}

.message-input__button {
  margin-left: 10px;
}

.message-input--disabled {
  opacity: 0.5;
}

/* Bad - unclear naming */
.input {
  display: flex;
}

.field {
  flex: 1;
}

.btn {
  margin-left: 10px;
}
```

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Test edge cases and error conditions
- Aim for high code coverage

```typescript
// Example unit test
describe('UserService', () => {
  it('should return user data', async () => {
    const service = new UserService();
    const result = await service.getUser('user-id');
    expect(result).toEqual(expectedUserData);
  });
  
  it('should handle errors gracefully', async () => {
    const service = new UserService();
    await expect(service.getUser('invalid-id')).rejects.toThrow();
  });
});
```

### Integration Tests

- Test component interactions
- Test API endpoints
- Test WebSocket events
- Use test database

```typescript
// Example integration test
describe('Message API', () => {
  it('should create and retrieve message', async () => {
    const response = await api.messages.send({
      channelId: 'test-channel',
      content: 'Test message',
      type: 'text'
    });
    
    expect(response.success).toBe(true);
    expect(response.data.content).toBe('Test message');
  });
});
```

### E2E Tests

- Test complete user flows
- Test across different browsers
- Test real-world scenarios
- Use headless browsers for CI

```typescript
// Example E2E test
describe('User Registration Flow', () => {
  it('should register and login user', async () => {
    await page.goto('/register');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass123');
    await page.click('#register-button');
    
    await expect(page).toHaveURL('/chat');
  });
});
```

## Commit Guidelines

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
# Good commit messages
git commit -m "feat(auth): add OAuth2 support"
git commit -m "fix(api): resolve null reference in user endpoint"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(client): migrate to Zustand for state management"

# Bad commit messages
git commit -m "fixed bug"
git commit -m "update"
git commit -m "wip"
```

### Commit Body

Provide additional context in the commit body:

```bash
git commit -m "feat(api): add rate limiting

Add rate limiting to all API endpoints to prevent abuse.
- 100 requests per 15 minutes for general API
- 5 requests per 15 minutes for auth endpoints

Closes #123"
```

## Pull Request Process

### Before Submitting

1. **Update documentation**: Update relevant docs for your changes
2. **Add tests**: Ensure new code has appropriate tests
3. **Run tests**: Make sure all tests pass
4. **Check formatting**: Ensure code follows style guidelines
5. **Sync with main**: Rebase your branch on latest main

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request on GitHub with:
   - Clear title describing the change
   - Detailed description of what you did and why
   - Reference any related issues
   - Screenshots for UI changes
   - Testing instructions

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Feature tested on multiple browsers (if applicable)

### Review Process

1. **Automated checks**: CI/CD pipeline runs tests
2. **Code review**: Maintainers review your code
3. **Feedback**: Address review comments
4. **Approval**: Get approval from maintainers
5. **Merge**: PR is merged into main branch

### Handling Review Feedback

- Respond to all review comments
- Make requested changes or explain why not
- Be open to suggestions
- Keep discussions professional and constructive

## Release Process

### Versioning

We follow Semantic Versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number updated
- [ ] Git tag created
- [ ] Release published on GitHub

### Creating a Release

```bash
# Update version in package.json
npm version minor  # or major, patch

# Create git tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# Push tag
git push origin v1.2.3

# GitHub will automatically create release from tag
```

## Getting Help

### Questions

- Check existing documentation
- Search existing issues
- Ask in discussions (if available)
- Contact maintainers

### Reporting Issues

- Use GitHub issue tracker
- Provide detailed information
- Include steps to reproduce
- Add relevant logs/error messages

### Feature Requests

- Check if feature already exists
- Use GitHub issue tracker
- Describe the use case
- Suggest implementation approach

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to Atomic Chat! 🎉
