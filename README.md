# Claude Dev Stats - Claude Code 智能开发统计分析系统

基于 Claude Code 现有数据源的智能分析工具，使用 TypeScript + Node.js 技术栈，通过零延迟的数据读取和分析方案，提供项目级别的开发统计与效率分析。

## 🚀 快速开始

### 环境要求
- Node.js 16+
- TypeScript 5.x
- Claude Code 已安装并配置

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

## 🧪 测试系统

本项目提供了完整的测试用例集成环境，支持多种测试类型：

### 测试框架配置
- **测试框架**: Jest + TypeScript
- **覆盖率工具**: Istanbul
- **Mock工具**: 内置 Mock 数据生成器
- **性能测试**: 自定义性能基准测试

### 运行测试

#### 单元测试
```bash
npm run test:unit
```

#### 集成测试  
```bash
npm run test:integration
```

#### 端到端测试
```bash
npm run test:e2e
```

#### 性能测试
```bash
npm run test:performance
```

#### 运行所有测试
```bash
npm run test:all
```

#### 监听模式
```bash
npm run test:watch
```

#### 生成覆盖率报告
```bash
npm run test:coverage
```

### 测试脚本选项

使用自定义测试运行器：
```bash
# 基本用法
node scripts/test-runner.js <command> [options]

# 运行单元测试并监听变化
node scripts/test-runner.js unit --watch

# 运行所有测试并在首次失败时停止
node scripts/test-runner.js all --bail

# 生成详细的测试报告
node scripts/test-runner.js report

# 清理测试环境
node scripts/test-runner.js clean
```

## 📊 测试覆盖率目标

- **单元测试**: >85% 覆盖率
- **集成测试**: 核心业务流程100%覆盖
- **性能测试**: 关键操作性能基准
- **错误处理**: 异常情况和边界条件覆盖

## 🏗️ 项目架构

### 目录结构
```
src/
├── data-sources/       # 数据源管理模块
├── analytics/          # 分析引擎模块  
├── commands/           # slash commands
├── reports/            # 报告生成器
├── utils/              # 工具函数
└── types/              # TypeScript类型定义

tests/
├── unit/              # 单元测试
├── integration/       # 集成测试  
├── e2e/              # 端到端测试
├── performance/      # 性能测试
├── mocks/           # Mock数据和工具
└── setup.ts         # 测试环境配置
```

### 核心模块测试

#### 数据源管理器 (DataSourceManager)
- ✅ 数据源自动发现
- ✅ 多数据源优先级选择  
- ✅ JSONL日志解析
- ✅ 数据格式规范化
- ✅ 错误处理和降级

#### 分析引擎 (AnalyticsEngine)
- ✅ 基础统计计算
- ✅ 效率指标计算
- ✅ 代码变更量估算
- ✅ 趋势分析算法
- ✅ 智能洞察生成

#### 报告生成器 (ReportGenerator)
- ✅ 中英文双语支持
- ✅ 多种输出格式
- ✅ 模板系统
- ✅ 数据可视化

## 🔧 开发工具配置

### 代码质量
- **ESLint**: TypeScript代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 严格类型检查

### CI/CD
- **GitHub Actions**: 自动化测试和构建
- **多Node.js版本**: 16.x, 18.x, 20.x兼容性测试
- **自动化报告**: 覆盖率报告和性能基准

## 📈 性能基准

当前性能目标：
- 1000条JSONL记录解析: <2秒
- 2000条数据基础统计: <3秒  
- 1500条数据趋势分析: <5秒
- 5个项目并发分析: <8秒
- 内存使用增长: <50MB (5000条记录)

## 🧩 Mock数据系统

提供完整的测试数据生成器：

```typescript
import { mockUsageData, generateUsageDataBatch } from '@tests/mocks/data';

// 生成单条测试数据
const singleData = mockUsageData({
  session_id: 'test-session',
  active_time_seconds: 3600,
  token_usage: { total_tokens: 1000 }
});

// 批量生成测试数据
const batchData = generateUsageDataBatch(100, {
  dateRange: [new Date('2024-01-01'), new Date('2024-01-31')],
  projectPaths: ['/project1', '/project2']
});
```

## 🚦 测试策略

### 测试金字塔
1. **单元测试** (70%): 核心业务逻辑和算法
2. **集成测试** (20%): 模块间交互和数据流
3. **端到端测试** (10%): 完整业务场景

### 测试用例分类
- **正常场景**: 标准数据处理流程
- **边界条件**: 空数据、极值、异常输入
- **错误处理**: 文件不存在、网络异常、数据损坏
- **性能测试**: 大数据量、并发处理、内存优化

## 📋 开发检查清单

在提交代码前请确保：
- [ ] 所有测试通过 (`npm run test:all`)
- [ ] 代码检查通过 (`npm run lint`)  
- [ ] 类型检查通过 (`npm run typecheck`)
- [ ] 代码格式化正确 (`npm run format:check`)
- [ ] 测试覆盖率达标 (`npm run test:coverage`)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 编写测试用例
4. 实现功能代码
5. 确保所有测试通过
6. 提交更改 (`git commit -m 'Add AmazingFeature'`)
7. 推送到分支 (`git push origin feature/AmazingFeature`)
8. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 技术选型说明

选择 TypeScript + Node.js 的核心优势：
- **类型安全**: 编译时错误检查，减少运行时问题
- **异步优势**: 原生异步模型高效处理大文件I/O
- **生态丰富**: npm生态系统和工具链成熟
- **部署简单**: 一键安装，依赖管理自动化
- **跨平台性**: Node.js跨平台一致性好

🚀 享受你的 Claude Code 统计分析之旅！