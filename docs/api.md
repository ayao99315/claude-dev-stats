# API 参考文档

本文档提供 Claude Code Stats 系统的完整 API 参考，包括所有核心模块的接口定义、使用方法和示例代码。

## 📚 目录

- [数据管理模块](#数据管理模块)
- [分析引擎模块](#分析引擎模块)
- [报告生成模块](#报告生成模块)
- [命令行接口模块](#命令行接口模块)
- [工具函数模块](#工具函数模块)
- [类型定义](#类型定义)
- [错误处理](#错误处理)
- [使用示例](#使用示例)

---

## 数据管理模块

### SimplifiedDataManager

负责数据源管理和使用数据获取的核心类。

#### 构造函数

```typescript
import { SimplifiedDataManager } from '@/data-sources';

const dataManager = new SimplifiedDataManager(options?: DataSourceOptions);
```

##### 参数

- `options` (可选): 数据源配置选项
  - `costApiEnabled: boolean` - 是否启用 Cost API（默认：true）
  - `opentelemetryEnabled: boolean` - 是否启用 OpenTelemetry（默认：false）
  - `projectPath?: string` - 项目路径（可选）

#### 主要方法

##### getUsageStats()

获取项目使用统计数据。

```typescript
async getUsageStats(
  options?: UsageStatsOptions
): Promise<BasicUsageStats[]>
```

**参数:**
- `options` (可选): 查询选项
  - `projectPath?: string` - 项目路径
  - `dateRange?: [Date, Date]` - 日期范围
  - `includeSystemData?: boolean` - 是否包含系统数据

**返回:** Promise<BasicUsageStats[]> - 使用统计数据数组

**示例:**
```typescript
const dataManager = new SimplifiedDataManager();

// 获取当前项目数据
const stats = await dataManager.getUsageStats();

// 获取指定时间范围的数据
const stats = await dataManager.getUsageStats({
  dateRange: [new Date('2024-08-01'), new Date('2024-08-31')]
});
```

##### getCostData()

获取成本相关数据。

```typescript
async getCostData(projectPath?: string): Promise<CostData[]>
```

**示例:**
```typescript
const costData = await dataManager.getCostData('/path/to/project');
```

##### getOTelData()

获取 OpenTelemetry 数据（如果可用）。

```typescript
async getOTelData(
  projectPath?: string,
  options?: OTelOptions
): Promise<OTelData[]>
```

##### checkDataSourceAvailability()

检查数据源可用性。

```typescript
async checkDataSourceAvailability(): Promise<DataSourceStatus>
```

**返回:** 数据源状态对象
```typescript
interface DataSourceStatus {
  costApi: {
    available: boolean;
    message: string;
  };
  opentelemetry: {
    available: boolean;
    message: string;
  };
  recommendations: string[];
}
```

---

## 分析引擎模块

### AnalyticsEngine

统一的分析引擎，整合所有分析功能。

#### 构造函数

```typescript
import { AnalyticsEngine } from '@/analytics';

const analytics = new AnalyticsEngine(
  dataManager: SimplifiedDataManager,
  options?: AnalyticsOptions
);
```

#### 主要方法

##### generateFullReport()

生成完整的分析报告。

```typescript
async generateFullReport(
  data?: BasicUsageStats[],
  options?: AnalysisOptions
): Promise<FullAnalysisReport>
```

**示例:**
```typescript
const analytics = new AnalyticsEngine(dataManager);
const report = await analytics.generateFullReport();

console.log(`生产力评分: ${report.efficiency.productivityScore}`);
console.log(`主要洞察: ${report.insights.primaryInsights[0].message}`);
```

##### calculateBasicStats()

计算基础统计信息。

```typescript
async calculateBasicStats(data: BasicUsageStats[]): Promise<BasicStatsResult>
```

##### calculateEfficiencyMetrics()

计算效率指标。

```typescript
async calculateEfficiencyMetrics(
  data: BasicUsageStats[]
): Promise<EfficiencyMetrics>
```

##### analyzeTrends()

进行趋势分析。

```typescript
async analyzeTrends(
  data: BasicUsageStats[],
  options?: TrendAnalysisOptions
): Promise<TrendAnalysis>
```

##### generateInsights()

生成智能洞察。

```typescript
async generateInsights(
  basicStats: BasicStatsResult,
  efficiency: EfficiencyMetrics,
  trends: TrendAnalysis,
  options?: InsightOptions
): Promise<SmartInsights>
```

### BasicStatsCalculator

基础统计计算器。

#### 主要方法

##### calculateTimeStats()

计算时间相关统计。

```typescript
calculateTimeStats(data: BasicUsageStats[]): TimeStats
```

##### calculateTokenStats()

计算Token统计。

```typescript
calculateTokenStats(data: BasicUsageStats[]): TokenStats
```

##### calculateCostStats()

计算成本统计。

```typescript
calculateCostStats(data: BasicUsageStats[]): CostStats
```

##### calculateSessionStats()

计算会话统计。

```typescript
calculateSessionStats(data: BasicUsageStats[]): SessionStats
```

### EfficiencyCalculator

效率分析计算器。

#### 主要方法

##### calculateProductivityScore()

计算生产力评分（0-10分制）。

```typescript
calculateProductivityScore(
  basicStats: BasicStatsResult,
  estimatedLines: number
): number
```

##### estimateCodeLines()

估算代码行数。

```typescript
estimateCodeLines(data: BasicUsageStats[]): number
```

##### calculateEfficiencyRating()

计算效率评级。

```typescript
calculateEfficiencyRating(score: number): EfficiencyRating
```

**返回值:** `'excellent' | 'good' | 'average' | 'poor'`

---

## 报告生成模块

### ReportGenerator

多格式报告生成器，支持中英文双语。

#### 构造函数

```typescript
import { ReportGenerator } from '@/reports';

const generator = new ReportGenerator(options?: ReportOptions);
```

##### 参数

- `options` (可选): 报告配置
  - `language?: 'zh-CN' | 'en-US'` - 语言（默认：'zh-CN'）
  - `cacheEnabled?: boolean` - 是否启用缓存（默认：true）
  - `defaultFormat?: ReportFormat` - 默认格式（默认：'table'）

#### 主要方法

##### generateReport()

生成指定格式的报告。

```typescript
async generateReport(
  reportData: FullAnalysisReport,
  format: ReportFormat = 'table',
  options?: GenerateOptions
): Promise<FormattedReport>
```

**支持的格式:**
- `'table'` - 表格格式（默认）
- `'detailed'` - 详细文本报告
- `'simple'` - 简要统计信息
- `'chart'` - 文本图表可视化
- `'json'` - JSON结构化数据
- `'export'` - 导出友好格式
- `'compact'` - 紧凑格式
- `'markdown'` - Markdown格式
- `'summary'` - 摘要格式

**示例:**
```typescript
const generator = new ReportGenerator({ language: 'zh-CN' });

// 生成表格报告
const tableReport = await generator.generateReport(reportData, 'table');

// 生成详细报告
const detailedReport = await generator.generateReport(reportData, 'detailed', {
  includeCharts: true,
  includeInsights: true
});

// 生成JSON格式用于程序处理
const jsonReport = await generator.generateReport(reportData, 'json');
```

##### exportReport()

导出报告到文件。

```typescript
async exportReport(
  report: FormattedReport,
  filePath: string,
  options?: ExportOptions
): Promise<ExportResult>
```

**示例:**
```typescript
const result = await generator.exportReport(
  report,
  './reports/monthly-analysis.txt',
  { includeMetadata: true }
);
```

##### setLanguage()

设置报告语言。

```typescript
setLanguage(language: 'zh-CN' | 'en-US'): void
```

##### clearCache()

清理报告缓存。

```typescript
clearCache(): void
```

### TextChartGenerator

文本图表生成器，支持ASCII和Unicode渲染。

#### 构造函数

```typescript
import { TextChartGenerator } from '@/utils/text-charts';

const chartGen = new TextChartGenerator(options?: ChartOptions);
```

#### 主要方法

##### generateBarChart()

生成柱状图。

```typescript
generateBarChart(
  data: ChartDataPoint[],
  options?: BarChartOptions
): string
```

##### generateLineChart()

生成折线图。

```typescript
generateLineChart(
  data: ChartDataPoint[],
  options?: LineChartOptions
): string
```

##### generatePieChart()

生成饼图。

```typescript
generatePieChart(
  data: ChartDataPoint[],
  options?: PieChartOptions
): string
```

**示例:**
```typescript
const chartGen = new TextChartGenerator({ unicode: true });

const barChart = chartGen.generateBarChart([
  { name: 'Read', value: 45 },
  { name: 'Write', value: 23 },
  { name: 'Edit', value: 67 }
], { title: '工具使用分布', width: 50 });

console.log(barChart);
```

---

## 命令行接口模块

### CommandLineInterface

CLI命令路由和处理系统。

#### 构造函数

```typescript
import { CommandLineInterface } from '@/commands';

const cli = new CommandLineInterface(options?: CLIOptions);
```

#### 主要方法

##### run()

运行CLI命令。

```typescript
async run(args?: string[]): Promise<void>
```

##### addCommand()

添加自定义命令。

```typescript
addCommand(
  name: string,
  description: string,
  handler: CommandHandler
): void
```

### StatsHandler

处理所有 `/stats` 系列命令的处理器。

#### 支持的命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `/stats basic` | 基础统计信息 | `claude-stats /stats basic` |
| `/stats efficiency` | 效率分析 | `claude-stats /stats efficiency --format detailed` |
| `/stats tools` | 工具使用分析 | `claude-stats /stats tools --chart` |
| `/stats cost` | 成本分析 | `claude-stats /stats cost --breakdown model` |
| `/stats trends` | 趋势分析 | `claude-stats /stats trends --duration 30d` |
| `/stats insights` | 智能洞察 | `claude-stats /stats insights --priority high` |
| `/stats compare` | 数据比较 | `claude-stats /stats compare --period1 "..." --period2 "..."` |
| `/stats export` | 数据导出 | `claude-stats /stats export --format json` |
| `/stats check` | 系统检查 | `claude-stats /stats check --diagnose` |

#### 共同参数

所有 `/stats` 命令都支持以下参数：

- `--format <format>` - 输出格式
- `--lang <language>` - 语言设置
- `--project <path>` - 项目路径
- `--output <file>` - 输出文件
- `--verbose` - 详细输出

---

## 工具函数模块

### 错误处理工具

#### ErrorMessageFormatter

统一错误消息格式化器。

```typescript
import { ErrorMessageFormatter } from '@/utils/error-messages';

const formatter = new ErrorMessageFormatter('zh-CN');
const message = formatter.formatError(error, 'DATA_SOURCE_UNAVAILABLE');
```

#### Troubleshooter

智能故障排除系统。

```typescript
import { Troubleshooter } from '@/utils/troubleshooter';

const troubleshooter = new Troubleshooter();
const diagnosis = await troubleshooter.diagnoseSystem();
const solutions = troubleshooter.generateSolutions(diagnosis);
```

#### ErrorReporter

隐私保护的错误报告系统。

```typescript
import { ErrorReporter } from '@/utils/error-reporter';

const reporter = new ErrorReporter({ privacyLevel: 'standard' });
await reporter.reportError(error, context);
```

### CLI辅助工具

#### InteractiveHelper

交互式用户体验组件。

```typescript
import { InteractiveHelper } from '@/commands/interactive';

const helper = new InteractiveHelper();
await helper.showProgress('分析数据中...', asyncTask);
```

主要方法：

##### showProgress()

显示进度指示器。

```typescript
async showProgress(
  message: string,
  task: Promise<any>,
  options?: ProgressOptions
): Promise<any>
```

##### showMultiStageProgress()

显示多阶段进度。

```typescript
async showMultiStageProgress(
  stages: ProgressStage[],
  options?: MultiStageOptions
): Promise<void>
```

##### displayColoredMessage()

显示彩色消息。

```typescript
displayColoredMessage(
  message: string,
  type: 'success' | 'warning' | 'error' | 'info',
  options?: ColorOptions
): void
```

---

## 类型定义

### 基础数据类型

#### BasicUsageStats

```typescript
interface BasicUsageStats {
  session_id: string;
  timestamp: string;
  project_path?: string;
  active_time_seconds: number;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost_info: {
    total_cost: number;
    model_costs: ModelCost[];
  };
  tool_usage: ToolUsageInfo[];
  file_operations: FileOperation[];
}
```

#### FullAnalysisReport

```typescript
interface FullAnalysisReport {
  metadata: {
    generatedAt: string;
    projectPath: string;
    dataRange: {
      start: string;
      end: string;
    };
    totalDataPoints: number;
  };
  basic: BasicStatsResult;
  efficiency: EfficiencyMetrics;
  trends: TrendAnalysis;
  insights: SmartInsights;
  costs: CostAnalysis;
}
```

### 分析结果类型

#### EfficiencyMetrics

```typescript
interface EfficiencyMetrics {
  tokensPerHour: number;
  estimatedLinesPerHour: number;
  productivityScore: number;
  efficiencyRating: EfficiencyRating;
  toolAnalysis: ToolAnalysisResult;
  codeEstimation: CodeEstimationResult;
}
```

#### TrendAnalysis

```typescript
interface TrendAnalysis {
  timeRange: {
    start: string;
    end: string;
  };
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1
  anomalies: AnomalyPoint[];
  seasonality: SeasonalityInfo;
  confidence: number; // 0-1
}
```

#### SmartInsights

```typescript
interface SmartInsights {
  primaryInsights: Insight[];
  recommendations: Recommendation[];
  warnings: Warning[];
  achievements: Achievement[];
  summary: InsightSummary;
}
```

---

## 错误处理

### 错误类型

系统定义了以下错误类型：

```typescript
enum ErrorType {
  DATA_SOURCE_ERROR = 'DATA_SOURCE_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR'
}
```

### 错误处理模式

#### 使用Result模式

```typescript
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// 使用示例
const result = await dataManager.getUsageStats();
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### 异常处理

```typescript
import { handleErrors, withRetry } from '@/utils/error-handler';

class MyService {
  @handleErrors(ErrorType.DATA_SOURCE_ERROR)
  @withRetry(3)
  async fetchData(): Promise<any> {
    // 业务逻辑
  }
}
```

---

## 使用示例

### 完整的数据分析流程

```typescript
import {
  SimplifiedDataManager,
  AnalyticsEngine,
  ReportGenerator
} from '@/';

async function performCompleteAnalysis() {
  try {
    // 1. 初始化数据管理器
    const dataManager = new SimplifiedDataManager({
      costApiEnabled: true,
      opentelemetryEnabled: false
    });

    // 2. 检查数据源可用性
    const status = await dataManager.checkDataSourceAvailability();
    if (!status.costApi.available) {
      throw new Error('Cost API不可用');
    }

    // 3. 获取使用数据
    const usageData = await dataManager.getUsageStats({
      dateRange: [
        new Date('2024-08-01'),
        new Date('2024-08-31')
      ]
    });

    // 4. 创建分析引擎
    const analytics = new AnalyticsEngine(dataManager);

    // 5. 生成完整报告
    const analysisReport = await analytics.generateFullReport(usageData);

    // 6. 生成可读报告
    const reportGenerator = new ReportGenerator({
      language: 'zh-CN',
      cacheEnabled: true
    });

    const formattedReport = await reportGenerator.generateReport(
      analysisReport,
      'detailed',
      {
        includeCharts: true,
        includeInsights: true
      }
    );

    // 7. 导出报告
    await reportGenerator.exportReport(
      formattedReport,
      './analysis-report.txt',
      { includeMetadata: true }
    );

    console.log('分析完成！');
    console.log(`生产力评分: ${analysisReport.efficiency.productivityScore}`);
    console.log(`总成本: $${analysisReport.basic.totalCost}`);

  } catch (error) {
    console.error('分析过程中发生错误:', error);
  }
}
```

### 自定义分析逻辑

```typescript
import { BasicStatsCalculator, EfficiencyCalculator } from '@/analytics';

async function customAnalysis(data: BasicUsageStats[]) {
  // 基础统计
  const basicCalc = new BasicStatsCalculator();
  const timeStats = basicCalc.calculateTimeStats(data);
  const tokenStats = basicCalc.calculateTokenStats(data);

  // 效率分析
  const efficiencyCalc = new EfficiencyCalculator();
  const estimatedLines = efficiencyCalc.estimateCodeLines(data);
  const productivityScore = efficiencyCalc.calculateProductivityScore(
    { timeStats, tokenStats },
    estimatedLines
  );

  return {
    activeHours: timeStats.totalActiveHours,
    totalTokens: tokenStats.totalTokens,
    estimatedLines,
    productivityScore
  };
}
```

### CLI命令扩展

```typescript
import { CommandLineInterface, CommandHandler } from '@/commands';

// 自定义命令处理器
const customHandler: CommandHandler = async (args, options) => {
  console.log('执行自定义命令...');
  // 自定义逻辑
};

// 添加自定义命令
const cli = new CommandLineInterface();
cli.addCommand(
  'custom-analysis',
  '执行自定义分析',
  customHandler
);

// 运行CLI
await cli.run();
```

### 报告格式自定义

```typescript
import { ReportGenerator } from '@/reports';

const generator = new ReportGenerator();

// 自定义报告模板
generator.addCustomTemplate('my-format', {
  header: (data) => `=== 我的自定义报告 ===\n`,
  section: (title, content) => `\n## ${title}\n${content}\n`,
  footer: (data) => `\n=== 报告结束 ===`
});

// 使用自定义格式
const report = await generator.generateReport(data, 'my-format');
```

---

## 高级用法

### 性能优化

#### 缓存配置

```typescript
// 启用分析结果缓存
const analytics = new AnalyticsEngine(dataManager, {
  cacheEnabled: true,
  cacheTTL: 300, // 5分钟
  maxCacheSize: 100
});

// 启用报告缓存
const generator = new ReportGenerator({
  cacheEnabled: true,
  cacheTTL: 300
});
```

#### 并行处理

```typescript
// 并行计算多个指标
const [basicStats, efficiency, trends] = await Promise.all([
  analytics.calculateBasicStats(data),
  analytics.calculateEfficiencyMetrics(data),
  analytics.analyzeTrends(data)
]);
```

### 扩展性

#### 自定义数据源

```typescript
import { DataSource } from '@/types';

class CustomDataSource implements DataSource {
  async getUsageData(): Promise<BasicUsageStats[]> {
    // 自定义数据获取逻辑
    return [];
  }
}

// 注册自定义数据源
const dataManager = new SimplifiedDataManager();
dataManager.addDataSource('custom', new CustomDataSource());
```

#### 插件系统

```typescript
import { AnalyticsPlugin } from '@/types';

class CustomAnalyticsPlugin implements AnalyticsPlugin {
  name = 'custom-insights';

  async analyze(data: BasicUsageStats[]): Promise<any> {
    // 自定义分析逻辑
    return {};
  }
}

// 注册插件
analytics.addPlugin(new CustomAnalyticsPlugin());
```

---

这份API文档涵盖了系统的所有主要接口和使用方法。如需更详细的信息，请参考源码中的TypeScript类型定义和JSDoc注释。