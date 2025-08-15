# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Dev Stats is an intelligent analysis tool for Claude Code usage data, built with **TypeScript + Node.js**. It analyzes local Claude Code data sources to provide project-level development statistics and efficiency insights through a CLI tool (`cc-stats`).

**Current Status**: Production-ready (95% complete) with minor optimizations remaining.

## Essential Commands

```bash
# Development workflow
npm install              # Install dependencies
npm run build           # Complete build (clean+compile+validate)
npm run dev             # Development mode with ts-node
npm run typecheck       # TypeScript type checking

# Code quality
npm run lint            # ESLint checking
npm run lint:fix        # Auto-fix lint issues
npm run format          # Prettier formatting
npm run precommit       # Pre-commit checks (lint+typecheck)

# Build and deployment
npm run clean           # Clean build artifacts
npm run setup          # Build + install CLI commands
npm run publish:dry    # Simulate publishing

# CLI usage verification
cc-stats --help         # View available commands
cc-stats stats          # Basic usage statistics
cc-stats check          # System diagnostics
```

## Architecture Overview

**Three-Layer Design**:
1. **Data Access Layer** (`src/data-sources/`): SimplifiedDataManager handles Cost API + OpenTelemetry
2. **Analytics Layer** (`src/analytics/`): AnalyticsEngine integrates all analysis modules
3. **User Interface Layer** (`src/commands/`, `src/reports/`): CLI system + bilingual reporting

**Data Flow**: `Data Retrieval → Analysis → Insights → Report Generation`

### Core Components

**AnalyticsEngine** (`src/analytics/index.ts`) - Main analysis class:
- Entry point integrating all analysis modules
- Key methods: `generateAnalysisReport()`, `quickAnalysis()`, `compareAnalysis()`
- Handles basic stats, efficiency, trends, insights, and cost analysis

**CLI System** (`src/commands/cli.ts`):
- 10+ `/stats` commands: basic, efficiency, tools, cost, trends, insights
- Commander.js routing with type-safe parameter validation
- Interactive user experience with progress indicators

**Report Generator** (`src/reports/generator.ts`):
- 9 output formats (table, detailed, simple, chart, json, etc.)
- Bilingual templates (Chinese/English)
- 5-minute TTL caching mechanism

## Data Sources Strategy

1. **Cost API** (`claude cost --json`) - Primary source, universally available
2. **OpenTelemetry** - Enhanced source, user-configurable for detailed monitoring

**Design Philosophy**: Focus on actually available data sources, avoid over-engineering multi-source fallbacks.

## Configuration

Location: `~/.claude/settings.json`
```json
{
  "cc-stats": {
    "enabled": true,
    "language": "zh-CN",
    "data_sources": {
      "cost_api": true,
      "opentelemetry": false
    },
    "analysis": {
      "project_level": true,
      "trend_analysis": true
    }
  }
}
```

**Project Detection**:
- Priority: `CLAUDE_PROJECT_DIR` environment variable
- Fallback: Git root → Current working directory → User config default

## Development Guidelines

### TypeScript Standards
- Strict mode required, avoid `any` types unless necessary
- All public APIs must have complete TypeScript type definitions
- Use `interface` over `type` for definitions
- JSDoc comments required for all public functions

### Code Organization
- Core data models in `src/types/` directory
- Async/await preferred over callbacks
- Error handling with appropriate Promise patterns

### Performance Requirements
- File I/O using Node.js async APIs
- Stream processing for large files to prevent memory overflow
- Caching for computation-intensive operations
- TypeScript compile-time optimizations

## Known Technical Debt

**Priority Fix**:
- CLI help command issue: `node ./dist/cli.js --help` produces no output with MaxListeners warning

**Quality Improvements**:
- Some Promise type usage needs optimization
- Maintain TypeScript strict mode consistency

## Extension Guidelines

When extending this production-ready system:
- Follow the existing three-layer architecture
- Implement new features through unified `AnalyticsEngine` interface
- Maintain bilingual support consistency
- Reference `src/analytics/insights.ts` rule engine pattern for new analysis features

## Build System Notes

- **CLI Binary**: `cc-stats` installed via `npm run setup`
- **Build Size**: ~384KB compiled
- **Dependencies**: Minimal runtime dependencies (chalk, commander, winston, tslib)
- **Target**: Node.js 16+ with cross-platform compatibility