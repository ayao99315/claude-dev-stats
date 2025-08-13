# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an intelligent analysis tool for Claude Code usage data, built with **TypeScript + Node.js**. It analyzes local Claude Code data sources to provide project-level development statistics and efficiency insights. The system focuses on data aggregation and analysis rather than data collection.

## Current Development Status

**Phase 2 (Analytics Engine)** is complete. **Phase 3** (Slash Commands implementation) is next.

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js 16+
- **包管理**: npm
- **测试框架**: Jest
- **构建系统**: TypeScript Compiler (tsc)
- **代码规范**: ESLint + Prettier

## 系统架构

### 简化的三层架构设计
1. **数据访问层** (`src/data-sources/`): 基于 Cost API 的可靠数据获取，可选 OpenTelemetry 增强
2. **智能分析层** (`src/analytics/`): 项目聚合、趋势计算、效率分析、洞察生成  
3. **用户交互层** (`src/commands/`, `src/reports/`): Slash Commands、报告生成、双语支持

### 核心数据流
```
数据获取 → 聚合分析 → 智能洞察 → 报告生成
```

## 开发命令

项目使用标准的 Node.js/TypeScript 开发工作流：

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建项目
npm run build

# 类型检查
npm run typecheck

# 代码检查
npm run lint
npm run lint:fix

# 代码格式化
npm run format
npm run format:check

# 运行测试
npm run test           # 单元测试
npm run test:unit      # 单元测试
npm run test:integration   # 集成测试
npm run test:e2e       # 端到端测试
npm run test:performance  # 性能测试
npm run test:all       # 所有测试
npm run test:watch     # 监听模式
npm run test:coverage  # 生成覆盖率报告
npm run test:clean     # 清理测试环境

# 预提交检查
npm run precommit

# 安装系统命令
npm run setup
```

## 核心组件

### SimplifiedDataManager (`src/data-sources/simplified-manager.ts`)
- 基于 Cost API 的可靠数据获取，支持可选的 OpenTelemetry 增强
- 简单的配置驱动机制，无复杂的自动发现逻辑
- 提供统一的数据接口，专注于实际可用的数据源
- 核心方法：`getCostData()`, `getOTelData()`, `getUsageStats()`

### AnalyticsEngine (`src/analytics/`)
- **基础统计** (`basic-stats.ts`): 计算时间、token、工具使用等基础指标
- **效率分析** (`efficiency.ts`): tokens_per_hour、lines_per_hour、productivity_score
- **趋势分析** (`trends.ts`): 历史数据趋势计算和模式识别
- **智能洞察** (`insights.ts`): AI 驱动的建议生成系统

### ReportGenerator (`src/reports/generator.ts`)
- 支持中英文双语报告生成
- 多种输出格式：表格、详细、简要、图表等
- 模板化系统，易于扩展新的报告类型

### CommandInterface (`src/commands/`)
- `/stats` 系列 slash commands 的完整实现
- 类型安全的参数处理和验证
- 友好的错误处理和用户体验优化

## 数据源策略
1. **Cost API** - 主数据源，可靠且实时可用，覆盖基础使用统计
2. **OpenTelemetry** - 增强数据源，需用户手动启用，提供详细监控数据

**设计理念**：专注于实际可用的数据源，避免过度工程化的多层降级

## 配置系统

配置文件：`~/.claude/settings.json`
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

## 项目识别机制
- 优先使用 `CLAUDE_PROJECT_DIR` 环境变量
- 降级策略：Git 根目录 → 当前工作目录 → 用户配置默认项目

## TypeScript 开发规范

### 类型安全要求
- 所有公共 API 必须有完整的 TypeScript 类型定义
- 使用 strict 模式，禁止 `any` 类型（除非必要）
- 接口定义优先使用 `interface` 而非 `type`
- 错误处理使用 `Result<T, E>` 模式或适当的 Promise 错误处理

### 代码组织
- 核心数据模型定义在 `src/types/` 目录
- 单元测试文件后缀 `.test.ts` 或 `.spec.ts`
- 所有公共函数必须有 JSDoc 注释
- 优先使用 async/await，避免回调地狱

### 性能考虑
- 文件 I/O 使用 Node.js 异步 API
- 大文件处理使用流式处理，避免内存溢出
- 计算密集型操作实现缓存机制
- 利用 TypeScript 编译时优化，避免运行时类型检查

## 测试系统

### 测试架构
- **测试框架**: Jest + ts-jest
- **覆盖率**: Istanbul，HTML/LCOV 报告
- **测试分类**: 单元、集成、端到端、性能测试
- **Mock 系统**: 位于 `tests/mocks/` 的数据和文件系统 mock

### 测试执行器
项目使用自定义测试运行器 `scripts/test-runner.js`：
- 支持分类测试执行（unit/integration/e2e/performance）
- 独立的超时配置（单元测试30s，性能测试180s）
- 智能覆盖率收集（仅单元测试）
- 监听模式和清理功能

### 测试配置要点
- 路径映射：`@/` → `src/`, `@tests/` → `tests/`
- 覆盖率阈值：20%（开发阶段，生产应提升至85%+）
- TypeScript 严格模式配置
- 排除类型文件和入口文件

## 核心设计约束

- **零延迟设计**：不使用 hooks，避免影响 Claude Code 正常使用
- **类型安全**：充分利用 TypeScript 类型系统，减少运行时错误
- **隐私优先**：所有数据仅本地存储和分析
- **跨平台兼容**：支持 Windows、macOS、Linux