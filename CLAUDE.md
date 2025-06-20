# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Amazon Connect JSON Generator - a single-page web application that helps users create Amazon Connect-compatible `SetContactAttributes` JSON payloads for Contact Flows. The app provides a dynamic form builder with predefined templates for common use cases.

## Development Commands

```bash
# Start development server (runs on http://localhost:4321)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Code quality
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix auto-fixable ESLint issues
pnpm format            # Format code with Prettier
pnpm format:check      # Check formatting
pnpm typecheck         # Run TypeScript checks
```

## Architecture

- **Framework**: Astro with static site generation
- **Frontend**: Alpine.js for reactivity, Tailwind CSS for styling
- **TypeScript**: Strict TypeScript configuration extending Astro's strict tsconfig
- **Structure**: Modular component-based architecture with reusable Astro components
- **Layout**: Base layout in `src/layouts/Baselayout.astro` handles HTML structure and global CSS imports
- **Script Architecture**: External TypeScript file (`src/scripts/app.ts`) with class-based application logic

## Key Components

- **Button Component** (`src/components/Button.astro`): Reusable button with variants and accessibility
- **Select Component** (`src/components/Select.astro`): Accessible select dropdown with proper labeling
- **Toast Component** (`src/components/Toast.astro`): Enhanced notification system with icons and types
- **Main Interface**: Dynamic form builder with comprehensive validation and state management
- **Templates**: Predefined JSON templates in constants file for maintainability
- **JSON Generation**: Creates properly formatted Amazon Connect Contact Flow JSON with validation

## File Structure

```
src/
├── components/          # Reusable Astro components
├── constants/          # Application constants and templates
├── scripts/           # TypeScript application logic
├── types/            # TypeScript interfaces and types
├── layouts/          # Page layouts
└── pages/           # Application pages
```

## Features

### User Experience

- **Keyboard Shortcuts**: Ctrl+Enter (generate), Ctrl+C (copy), Ctrl+N (add field), Ctrl+R (reset)
- **Form Validation**: Real-time validation for duplicate names and empty fields
- **Auto-generation**: Debounced JSON generation as user types
- **State Persistence**: Form state saved to localStorage
- **Undo/Redo**: Full history management with Ctrl+Z/Ctrl+Y

### Accessibility

- **ARIA Labels**: Comprehensive accessibility attributes on all interactive elements
- **Keyboard Navigation**: Full keyboard support for all functionality
- **Screen Reader Support**: Live announcements for dynamic changes
- **Focus Management**: Proper focus handling and visual indicators

### Error Handling

- **Clipboard Fallback**: Graceful degradation for older browsers
- **Try-catch Blocks**: Comprehensive error handling throughout the application
- **User Feedback**: Clear error messages and validation feedback

## Template System

Templates are defined in `src/constants/index.ts` with TypeScript interfaces:

- CTI Pin lookup for ServiceNow integration
- FEM (Facility Emergency Message) status and messaging
- Generic queue templates with various callback and expected wait time configurations

## Development Notes

- **Code Quality**: ESLint and Prettier configured for consistent code style
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Performance**: Debounced operations and efficient DOM manipulation
- **Maintainability**: Modular architecture with separation of concerns
