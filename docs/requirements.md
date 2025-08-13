# Claude Code 开发统计与分析系统需求文档

## 项目概述

开发一个基于 Claude Code 现有数据源的智能分析工具，通过读取和分析 Claude Code 的本地使用数据，提供项目级别的开发统计与效率分析。该系统通过 slash commands 提供数据查询功能，专注于数据聚合分析而非重复数据收集。

## 功能需求

### 基础统计功能

#### 1. 开发时间统计
- **主数据来源**：Claude Code 的 Cost API（`claude cost` 命令）
- **增强数据源**：OpenTelemetry 监控数据（需用户主动启用）
- **定义**：从执行 `claude` 命令开始到会话结束的有效开发时间
- **颗粒度**：以会话为最小单位进行时间记录
- **项目识别**：基于 `CLAUDE_PROJECT_DIR` 环境变量精确识别项目
- **数据维度**：
  - 每日在各项目中的开发时间（分钟、小时）
  - 会话级别的时间分布
  - 简化的效率分析

#### 2. 代码变更统计
- **数据来源**：Claude Code 内置的 OpenTelemetry 监控 (lines of code modified)
- **统计内容**：新增行数 + 修改行数 + 删除行数的总和
- **辅助检测**：
  - 优先使用 git diff（如果项目有git）
  - 备选方案：基于 Claude Code 工具调用推断文件修改
- **数据维度**：
  - 每日在各项目中修改的文件数量
  - 每日在各项目中修改的代码行数

#### 3. Token 消耗统计
- **主数据来源**：Claude Code 的 Cost API（提供实时准确的 token 统计）
- **增强数据源**：OpenTelemetry token usage 监控（需用户配置）
- **统计维度**：
  - 每日在各项目中消耗的 token 数量
  - 单位时间内的 token 消耗量
  - 基础成本统计

#### 4. 工具调用统计
- **数据来源**：基于 Cost API 和可选的 OpenTelemetry 数据推断
- **统计内容**：记录基础的工具使用模式（简化版）
- **数据维度**：
  - 主要工具的使用频率估算
  - 基础的使用模式分析

### 进阶分析功能

#### 1. 效率分析指标
- **开发效率指标**：
  - 单位时间内的 token 消耗量（token/小时）
  - 单位时间内的代码编写量（行/小时）
  - 任务复杂度评估（基于工具使用模式）
- **时间分析**：
  - 每日开发时间分布
  - 历史效率趋势对比
  - 专注时间段识别
- **项目分析**：
  - 时间投入最多的项目排序
  - 各项目开发效率对比
  - 项目间工具使用差异

#### 2. 智能洞察
- **生产力模式识别**：
  - 周期性生产力模式
  - 学习曲线分析
  - 效率波动预警
- **成本优化建议**：
  - Token 使用优化建议
  - 工具使用效率建议
  - 项目投入时间建议

#### 3. 数据展示
- **报告格式**：支持中英文双语显示
- **查询方式**：通过 slash commands 实现即时查询
- **数据呈现**：文本格式的统计报告和图表

## 技术需求

### 系统架构

#### 1. 简化的数据访问层
- **实现方式**：基于 Claude Code 实际可用数据源，使用 TypeScript/Node.js 开发
- **双数据源策略**：
  - **主数据源**：Cost API（`claude cost` 命令）- 可靠且普遍可用
  - **增强数据源**：OpenTelemetry 导出数据 - 可选，需用户手动启用
- **设计理念**：专注于实际可用的数据源，避免过度工程化
- **性能要求**：零延迟（无 hooks 处理）
- **技术栈**：TypeScript + Node.js，利用其优秀的异步 I/O 性能和丰富的 npm 生态

#### 2. 数据存储层
- **系统级存储**：`~/.claude/cc-stats/`
  - 按天为单位存储，文件格式：`system-YYYY-MM-DD.json`
  - 包含所有项目的汇总数据
- **项目级存储**：`{PROJECT_ROOT}/cc-stats/`
  - 按天汇总数据：`daily-YYYY-MM-DD.json`
  - 项目级历史趋势数据
- **数据保留策略**：
  - 原始数据：按 Claude Code 保留策略
  - 汇总数据：长期保留
- **隐私保护**：所有数据仅存储在本地，不涉及网络传输

#### 3. 数据查询层（Slash Commands）
- **命令前缀**：`/stats`
- **查询类型**：
  - `/stats today`：今日统计
  - `/stats week`：本周统计  
  - `/stats project [project_name]`：指定项目统计
  - `/stats efficiency`：效率分析报告
  - `/stats tools`：工具使用统计
  - `/stats trends`：历史趋势分析

### 安装与配置

#### 1. 安装方式
- **目标**：开发成可安装的 npm 包，支持全局安装或项目本地安装
- **技术实现**：TypeScript 编译为 JavaScript，支持跨平台运行
- **安装路径**：
  - 分析脚本：`~/.claude/cc-stats/`（编译后的 JS 文件）
  - 配置文件：`~/.claude/settings.json`
  - Slash commands：`~/.claude/commands/`
- **依赖要求**：Node.js 16+ 
- **初始化**：提供 setup 脚本进行初始化配置

#### 2. 配置选项（简化版）
```json
{
  "cc-stats": {
    "enabled": true,
    "language": "zh-CN",  // zh-CN 或 en-US
    "data_sources": {
      "cost_api": true,     // 主数据源，始终启用
      "opentelemetry": false // 增强数据源，可选
    },
    "analysis": {
      "project_level": true,
      "trend_analysis": true
    }
  }
}
```

## 数据模型

### 使用数据结构（简化版，适配实际数据源）
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "project": "project-name",
  "tokens": {
    "input": 1000,
    "output": 1500,
    "total": 2500
  },
  "costs": {
    "input": 0.015,
    "output": 0.075,
    "total": 0.090
  },
  "session": {
    "duration_minutes": 60,
    "messages_count": 25
  },
  "source": "cost_api" // 或 "opentelemetry"
}
```

### 基础统计数据结构（简化版）
```json
{
  "project": "project-name",
  "timespan": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-01T23:59:59Z",
    "duration_minutes": 120
  },
  "tokens": {
    "input": 3000,
    "output": 2000,
    "total": 5000
  },
  "costs": {
    "input": 0.045,
    "output": 0.150,
    "total": 0.195
  },
  "activity": {
    "sessions": 3,
    "messages": 25,
    "tools_used": ["Read", "Edit", "Write"],
    "files_modified": 8
  },
  "data_quality": {
    "sources": ["cost_api"],
    "completeness": 0.7,
    "last_updated": "2024-01-01T23:59:59Z"
  }
}
```

## 实施阶段

### Phase 1: 简化数据访问（1周）
- 使用 TypeScript 实现 SimplifiedDataManager
- 开发 Cost API 数据获取器（利用 Node.js 异步处理）
- 可选的 OpenTelemetry 数据增强
- 基础的项目级数据聚合

### Phase 2: 增强分析（1.5周）
- 效率指标计算和趋势分析（TypeScript 类型安全保障）
- 智能洞察和建议系统
- 完整的查询命令集
- 双语支持和报告格式化

### Phase 3: 优化完善（1周）
- 性能优化和错误处理
- 跨平台兼容性测试（Windows/macOS/Linux）
- npm 打包和发布流程
- 文档和安装脚本
- 用户体验优化

## 项目开源要求

### GitHub 项目结构
```
claude-dev-stats/
├── README.md              # 项目说明（中英文）
├── package.json           # Node.js 项目配置
├── tsconfig.json          # TypeScript 配置
├── docs/                  # 文档目录
│   ├── installation.md    # 安装指南
│   ├── configuration.md   # 配置说明
│   └── api.md            # API 文档
├── src/                   # TypeScript 源代码
│   ├── analyzers/         # 数据分析器
│   ├── commands/         # slash commands
│   ├── data-sources/     # 数据源管理
│   └── utils/            # 工具函数
├── dist/                 # 编译后的 JavaScript 文件
├── scripts/              # 安装和设置脚本
├── tests/                # 测试文件（Jest）
└── examples/             # 使用示例
```

### 开源规范
- MIT License
- 完整的 README 和文档
- 版本管理和发布流程
- Issue 和 PR 模板

## 成功标准

1. **功能完整性**：实现所有基础统计功能，数据准确性 >95%
2. **性能要求**：零延迟，不影响 Claude Code 正常使用
3. **易用性**：安装配置简单，查询命令直观
4. **稳定性**：多数据源降级策略，错误处理完善
5. **差异化价值**：提供 ccusage 等现有工具没有的增强分析功能
6. **可扩展性**：支持后续功能扩展和自定义配置

## 核心优势

基于简化架构的核心优势：
- 🎯 **零延迟**：无 hooks 处理开销，不影响 Claude Code 使用体验
- 📊 **可靠数据**：基于 Cost API 主数据源，普遍可用且准确
- 🔧 **简化架构**：专注实际可用数据源，避免过度工程化
- 📈 **增强价值**：专注智能分析功能，而非复杂数据收集
- 🛡️ **高可靠**：简单的双数据源策略，降低系统复杂度
- ⚡ **高性能**：Node.js 异步 I/O 优化，TypeScript 类型安全
- 🔧 **易部署**：npm 生态系统，安装和依赖管理简单
- 🎨 **务实设计**：如无必要勿增实体，专注核心功能价值