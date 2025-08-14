# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an intelligent analysis tool for Claude Code usage data, built with **TypeScript + Node.js**. It analyzes local Claude Code data sources to provide project-level development statistics and efficiency insights. The system focuses on data aggregation and analysis rather than data collection.

## Current Development Status

All phases complete (95%). Project is production-ready with minor optimization items remaining.

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

项目使用自定义的构建和测试系统，基于 Node.js/TypeScript：

```bash
# 核心开发命令
npm install              # 安装依赖
npm run build           # 完整构建（清理+编译+验证）
npm run dev             # 开发模式（ts-node监听）
npm run typecheck       # TypeScript类型检查

# 代码质量
npm run lint            # ESLint检查
npm run lint:fix        # 自动修复lint问题
npm run format          # Prettier格式化
npm run precommit       # 完整预提交检查（lint+typecheck+test）

# 测试系统 (使用自定义test-runner.js)
npm run test:unit       # 单元测试（默认）
npm run test:integration # 集成测试（API一致性问题存在）
npm run test:coverage   # 生成HTML覆盖率报告
npm run test:watch      # 监听模式单元测试
npm run test:clean      # 清理测试环境

# 运行特定测试文件
node scripts/test-runner.js unit --testNamePattern="BasicStats"

# 构建和发布
npm run clean           # 清理构建产物
npm run setup          # 构建+安装CLI命令
npm run test:install   # 验证安装脚本（100%通过率）
npm run publish:dry    # 模拟发布
```

## 系统架构

### 三层架构设计
1. **数据访问层** (`src/data-sources/`): SimplifiedDataManager实现Cost API + OpenTelemetry双数据源
2. **智能分析层** (`src/analytics/`): AnalyticsEngine统合所有分析功能 
3. **用户交互层** (`src/commands/`, `src/reports/`): CLI命令系统 + 双语报告生成

### 核心组件架构

**AnalyticsEngine** (`src/analytics/index.ts`) - 分析引擎主类:
- 统一入口，整合所有分析模块
- 核心方法: `generateAnalysisReport()`, `quickAnalysis()`, `compareAnalysis()`
- 支持工具使用分析、成本分析、数据源可用性检查

**子模块组成**:
- `BasicStatsCalculator` (basic-stats.ts): 时间、token、成本基础统计
- `EfficiencyCalculator` (efficiency.ts): 生产力评分、代码行数估算  
- `TrendsAnalyzer` (trends.ts): 历史趋势、异常检测
- `InsightsGenerator` (insights.ts): 15+种智能洞察规则

**CommandInterface** (`src/commands/cli.ts`):
- 10个/stats系列命令: basic, efficiency, tools, cost, trends, insights等
- Commander.js路由 + 类型安全参数验证
- 交互式用户体验优化

**ReportGenerator** (`src/reports/generator.ts`):
- 支持5种报告类型、9种输出格式
- 双语模板系统（中英文动态切换）
- 缓存机制（5分钟TTL）和报告导出功能

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

## 测试系统与质量状态

### 测试架构现状
- **框架**: Jest + ts-jest，自定义test-runner.js控制执行流程
- **覆盖率分布**: 
  - `src/analytics/`: 95%+ ✅ (100%测试覆盖率)  
  - `src/utils/text-charts.ts`: 94.8% ✅
  - `src/commands/`: 60%+ ⚠️ (类型不匹配问题存在)
  - `src/data-sources/`: 0% ❌ (需要补充测试)
  - `src/reports/`: 10% ❌ (需要补充测试)

### 已知测试问题
- **集成测试失败**: API方法签名不匹配（如`performFullAnalysis()`方法不存在）
- **类型安全问题**: Promise返回值访问同步属性导致编译错误
- **CLI执行问题**: `node ./dist/cli.js --help`无输出（MaxListeners警告）

### 质量检查命令
```bash
# 快速质量检查
npm run precommit       # lint + typecheck + unit tests

# 覆盖率报告（HTML格式）
npm run test:coverage   
open coverage/index.html

# 验证构建完整性
npm run build           # 构建检查
npm run test:install    # 安装脚本验证（8/8通过）
```

## 核心设计原则

### 技术约束
- **零延迟设计**: 纯数据分析工具，不使用hooks，不影响Claude Code使用
- **类型安全优先**: 严格TypeScript配置，完整类型定义覆盖
- **隐私优先**: 所有数据本地处理，支持可配置的隐私级别
- **跨平台兼容**: Node.js 16+，支持Windows/macOS/Linux

### 数据流架构
**实际可用数据源策略**:
1. Cost API (`claude cost --json`) - 主数据源，普遍可用
2. OpenTelemetry - 增强数据源，用户可选启用

**避免的过度工程化**:
- 不依赖格式不确定的JSONL日志解析
- 不实现复杂的多数据源自动发现
- 不构建多层降级策略

## 当前技术债务

### 优先修复项
1. **CLI帮助命令问题**: `node ./dist/cli.js --help`无输出，MaxListeners警告
2. **集成测试API不匹配**: 测试中调用不存在的`performFullAnalysis()`方法  
3. **数据源模块测试缺失**: `src/data-sources/simplified-manager.ts`需要单元测试

### 代码质量改进
- `src/reports/`模块测试覆盖率仅10%
- 某些Promise类型使用需要优化
- 建议保持TypeScript strict模式的一致性

### 扩展建议
项目已达到生产就绪状态(95%完成度)。扩展开发时：
- 遵循现有的三层架构设计
- 新增功能优先在`AnalyticsEngine`中实现统一接口
- 保持双语支持的一致性
- 参考`src/analytics/insights.ts`的规则引擎模式