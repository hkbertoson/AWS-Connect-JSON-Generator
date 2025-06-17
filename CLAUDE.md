# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Amazon Connect JSON Generator - a single-page web application that helps users create Amazon Connect-compatible `SetContactAttributes` JSON payloads for Contact Flows. The app provides a dynamic form builder with predefined templates for common use cases.

## Development Commands

```bash
# Start development server (runs on http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

- **Framework**: Astro with static site generation
- **Frontend**: Alpine.js for reactivity, Tailwind CSS for styling
- **TypeScript**: Strict TypeScript configuration extending Astro's strict tsconfig
- **Structure**: Single-page application with one main page (`src/pages/index.astro`)
- **Layout**: Base layout in `src/layouts/Baselayout.astro` handles HTML structure and global CSS imports
- **Script Architecture**: Inline TypeScript in Astro component handles all application logic and DOM manipulation

## Key Components

- **Main Interface**: Dynamic form builder with add/remove field functionality
- **Templates**: Predefined JSON templates for different Amazon Connect scenarios (CTI lookup, callback flows, wait time messaging)
- **JSON Generation**: Creates properly formatted Amazon Connect Contact Flow JSON with `UpdateContactAttributes` action
- **Copy Functionality**: One-click clipboard copy with Alpine.js toast notifications

## Template System

The app includes several predefined templates:
- CTI Pin lookup for ServiceNow integration
- FEM (Facility Emergency Message) status and messaging
- Generic queue templates with various callback and expected wait time configurations

Each template populates the form with appropriate key-value pairs for Amazon Connect Contact Flows.

## Development Notes

- **Code Organization**: All application logic is contained in a single inline `<script>` tag within `index.astro` for simplicity
- **State Management**: Uses vanilla JavaScript DOM manipulation combined with Alpine.js for reactive UI elements
- **Template Data**: Templates are defined as TypeScript objects with proper typing for attributes
- **JSON Structure**: Generated JSON follows Amazon Connect Contact Flow v2019-10-30 format with UpdateContactAttributes action