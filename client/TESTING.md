# Testing Setup Documentation

## Overview

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing. The testing setup is configured to work with TypeScript, React components, and the project's specific architecture including Jotai state management and GridStack integration.

## Testing Framework Stack

- **Vitest**: Fast unit test framework built on top of Vite
- **React Testing Library**: Simple and complete testing utilities for React components
- **jsdom**: DOM environment for testing React components
- **@testing-library/user-event**: Testing library for simulating user interactions
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions

## Configuration

### Vite Configuration (`vite.config.ts`)

The Vite configuration includes test setup:

```typescript
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./src/test-setup.ts"],
  css: true,
},
```

### Test Setup (`src/test-setup.ts`)

Global test configuration including:
- Jest DOM matchers import
- GridStack mocking
- Window API mocks (IntersectionObserver, ResizeObserver, matchMedia)
- Global fetch mock

## Testing Scripts

Available npm scripts for testing:

```json
{
  "test": "vitest",           // Watch mode
  "test:ui": "vitest --ui",   // UI interface
  "test:run": "vitest run"    // Single run
}
```

## Mock Utilities

### Jotai Mocks (`src/__mocks__/jotai-utils.ts`)

Provides utilities for mocking Jotai atoms:
- Mock data for apps, widgets, dashboard layout
- `createMockAtomValues()` - Creates mock atom value mappings
- `createMockUseAtomValue()` - Creates mock useAtomValue implementation

### GridStack Mocks (`src/__mocks__/gridstack-utils.ts`)

Mock components and utilities for GridStack:
- `MockGridStackProvider`
- `MockGridStackRenderProvider`
- `MockGridStackRender`
- Mock context hooks

## Dashboard Component Tests

### Test Structure

The Dashboard component tests (`src/pages/dashboard/index.test.tsx`) cover:

1. **Rendering States**
   - Dashboard header display
   - Empty state when no widgets
   - GridStack rendering with widgets

2. **User Interactions**
   - Add Widget button functionality
   - Widget drawer open/close behavior

3. **State Management**
   - Jotai atom integration
   - Handling of empty/null states
   - Error resilience

4. **Component Integration**
   - WidgetDrawer integration
   - GridStack component integration

5. **Error Handling**
   - Missing app data scenarios
   - Render consistency across updates

### Key Testing Patterns

#### Mocking Jotai Atoms

```typescript
beforeEach(async () => {
  const { useAtomValue, useSetAtom } = await import("jotai");
  const mockUseAtomValue = vi.mocked(useAtomValue);

  mockUseAtomValue.mockImplementation((atom: any) => {
    if (atom === "installedAppsAtom") return mockInstalledApps;
    // ... other atom mappings
    return [];
  });
});
```

#### Testing User Interactions

```typescript
it("handles Add Widget button click", async () => {
  const user = userEvent.setup();
  render(<DashboardPage />);

  const addButton = screen.getByText("Add Widget").closest("button");
  await user.click(addButton!);

  expect(screen.getByTestId("widget-drawer")).toBeVisible();
});
```

#### Testing Component Rendering

```typescript
it("renders dashboard header", () => {
  render(<DashboardPage />);

  expect(screen.getByText("Dashboard")).toBeInTheDocument();
  expect(screen.getByText("Manage your widgets...")).toBeInTheDocument();
});
```

## Best Practices

### 1. Mock Strategy

- Mock external dependencies at the module level
- Use factory functions to avoid hoisting issues
- Mock only what's necessary for the test

### 2. Data Testing

- Use realistic mock data that matches production types
- Test both success and error scenarios
- Include edge cases (empty arrays, null values)

### 3. Component Integration

- Test component interactions, not implementation details
- Focus on user-visible behavior
- Use semantic queries (getByRole, getByText) over test-ids when possible

### 4. Async Testing

- Use `async/await` for user interactions
- Wait for state changes with proper assertions
- Handle loading states appropriately

## Running Tests

### Development

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui
```

### CI/Production

```bash
# Run tests once
pnpm test:run
```

## Troubleshooting

### Common Issues

1. **Module hoisting errors**: Ensure mock functions are defined before `vi.mock()` calls
2. **GridStack CSS imports**: Mocked in test-setup.ts
3. **Jotai atom mocking**: Use string identifiers and proper mock implementations
4. **Async state updates**: Use proper async/await patterns

### Debugging

- Use `screen.debug()` to see rendered HTML
- Check mock function calls with `expect().toHaveBeenCalled()`
- Use Vitest UI for interactive debugging

## Adding New Tests

### For New Components

1. Create `[component].test.tsx` alongside the component
2. Follow the established mocking patterns
3. Cover rendering, interactions, and error cases
4. Use semantic queries and meaningful test descriptions

### For New Features

1. Add relevant mock data to mock utilities
2. Update existing tests if they're affected
3. Test both happy path and edge cases
4. Consider integration with other components

## Test Coverage

The test suite currently covers:
- Component rendering in various states
- User interaction flows
- State management integration
- Error handling and edge cases
- Component integration patterns

This provides a solid foundation for maintaining code quality and preventing regressions as the project evolves.