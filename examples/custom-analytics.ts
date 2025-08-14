/**
 * 自定义分析逻辑示例
 * 
 * 本示例展示如何扩展系统的分析能力，包括：
 * 1. 自定义分析插件开发
 * 2. 自定义指标计算
 * 3. 特殊业务逻辑实现
 * 4. 分析结果的自定义处理
 */

import {
  SimplifiedDataManager,
  AnalyticsEngine,
  BasicStatsCalculator,
  EfficiencyCalculator
} from '../src';
import { BasicUsageStats, AnalyticsPlugin } from '../src/types';

/**
 * 代码质量分析插件
 * 基于工具使用模式评估代码质量
 */
class CodeQualityAnalysisPlugin implements AnalyticsPlugin {
  name = 'code-quality-analyzer';
  version = '1.0.0';
  description = '基于工具使用模式分析代码质量';

  async analyze(data: BasicUsageStats[]): Promise<CodeQualityMetrics> {
    const qualityMetrics = {
      refactoringFrequency: this.calculateRefactoringFrequency(data),
      testingHabits: this.analyzeTestingHabits(data),
      documentationPractice: this.evaluateDocumentationPractice(data),
      codeReviewPatterns: this.analyzeCodeReviewPatterns(data),
      overallQualityScore: 0,
      qualityRating: 'unknown' as QualityRating,
      recommendations: [] as string[]
    };

    // 计算综合质量评分
    qualityMetrics.overallQualityScore = this.calculateOverallQualityScore(qualityMetrics);
    qualityMetrics.qualityRating = this.determineQualityRating(qualityMetrics.overallQualityScore);
    qualityMetrics.recommendations = this.generateQualityRecommendations(qualityMetrics);

    return qualityMetrics;
  }

  private calculateRefactoringFrequency(data: BasicUsageStats[]): RefactoringMetrics {
    let refactoringEvents = 0;
    let totalEditEvents = 0;
    let refactoringDuration = 0;

    data.forEach(record => {
      record.tool_usage?.forEach(tool => {
        if (tool.tool_name === 'Edit') {
          totalEditEvents++;
          
          // 启发式检测重构：大量连续编辑操作
          if (tool.duration_seconds && tool.duration_seconds > 300) { // 5分钟以上的编辑
            refactoringEvents++;
            refactoringDuration += tool.duration_seconds;
          }
        }
      });
    });

    const frequency = totalEditEvents > 0 ? refactoringEvents / totalEditEvents : 0;
    const avgRefactoringDuration = refactoringEvents > 0 ? refactoringDuration / refactoringEvents : 0;

    return {
      frequency,
      totalRefactoringEvents: refactoringEvents,
      avgRefactoringDuration,
      refactoringIntensity: this.calculateRefactoringIntensity(frequency, avgRefactoringDuration)
    };
  }

  private calculateRefactoringIntensity(frequency: number, avgDuration: number): 'low' | 'medium' | 'high' {
    const intensityScore = frequency * 0.7 + (avgDuration / 1800) * 0.3; // 30分钟标准化
    
    if (intensityScore > 0.7) return 'high';
    if (intensityScore > 0.3) return 'medium';
    return 'low';
  }

  private analyzeTestingHabits(data: BasicUsageStats[]): TestingMetrics {
    let testFileOperations = 0;
    let totalFileOperations = 0;
    let testWriteOperations = 0;

    data.forEach(record => {
      record.file_operations?.forEach(fileOp => {
        totalFileOperations++;
        
        // 检测测试文件操作
        if (this.isTestFile(fileOp.file_path)) {
          testFileOperations++;
          
          if (fileOp.operation_type === 'write' || fileOp.operation_type === 'create') {
            testWriteOperations++;
          }
        }
      });
    });

    const testCoverage = totalFileOperations > 0 ? testFileOperations / totalFileOperations : 0;
    const testWriteRatio = testFileOperations > 0 ? testWriteOperations / testFileOperations : 0;

    return {
      testCoverage,
      testWriteRatio,
      testFileOperations,
      testDrivenDevelopment: this.assessTDD(testWriteRatio, testCoverage),
      testingConsistency: this.calculateTestingConsistency(data)
    };
  }

  private isTestFile(filePath: string): boolean {
    if (!filePath) return false;
    
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /_test\./,
      /test_.*\.js$/,
      /tests?\//,
      /__tests__\//
    ];

    return testPatterns.some(pattern => pattern.test(filePath));
  }

  private assessTDD(testWriteRatio: number, testCoverage: number): 'strong' | 'moderate' | 'weak' | 'none' {
    if (testWriteRatio > 0.4 && testCoverage > 0.3) return 'strong';
    if (testWriteRatio > 0.2 && testCoverage > 0.15) return 'moderate';
    if (testWriteRatio > 0.1 || testCoverage > 0.05) return 'weak';
    return 'none';
  }

  private calculateTestingConsistency(data: BasicUsageStats[]): number {
    // 计算测试操作在时间上的分布一致性
    const testingDays = new Set<string>();
    
    data.forEach(record => {
      const hasTestingActivity = record.file_operations?.some(fileOp => 
        this.isTestFile(fileOp.file_path)
      );
      
      if (hasTestingActivity) {
        const date = new Date(record.timestamp).toDateString();
        testingDays.add(date);
      }
    });

    const totalDays = Math.max(1, Math.ceil(
      (new Date().getTime() - new Date(data[0]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
    ));

    return testingDays.size / totalDays;
  }

  private evaluateDocumentationPractice(data: BasicUsageStats[]): DocumentationMetrics {
    let docFileOperations = 0;
    let totalFileOperations = 0;
    let readmeOperations = 0;

    data.forEach(record => {
      record.file_operations?.forEach(fileOp => {
        totalFileOperations++;
        
        if (this.isDocumentationFile(fileOp.file_path)) {
          docFileOperations++;
          
          if (fileOp.file_path.toLowerCase().includes('readme')) {
            readmeOperations++;
          }
        }
      });
    });

    const documentationRatio = totalFileOperations > 0 ? docFileOperations / totalFileOperations : 0;
    const readmeAttention = docFileOperations > 0 ? readmeOperations / docFileOperations : 0;

    return {
      documentationRatio,
      readmeAttention,
      docFileOperations,
      documentationQuality: this.assessDocumentationQuality(documentationRatio, readmeAttention)
    };
  }

  private isDocumentationFile(filePath: string): boolean {
    if (!filePath) return false;
    
    const docPatterns = [
      /\.md$/,
      /\.rst$/,
      /\.txt$/,
      /readme/i,
      /changelog/i,
      /contributing/i,
      /license/i,
      /docs?\//
    ];

    return docPatterns.some(pattern => pattern.test(filePath));
  }

  private assessDocumentationQuality(docRatio: number, readmeAttention: number): 'excellent' | 'good' | 'fair' | 'poor' {
    const qualityScore = docRatio * 0.7 + readmeAttention * 0.3;
    
    if (qualityScore > 0.15) return 'excellent';
    if (qualityScore > 0.1) return 'good';
    if (qualityScore > 0.05) return 'fair';
    return 'poor';
  }

  private analyzeCodeReviewPatterns(data: BasicUsageStats[]): CodeReviewMetrics {
    let reviewRelatedOperations = 0;
    let totalOperations = 0;
    let iterativeEditPatterns = 0;

    data.forEach(record => {
      totalOperations += record.file_operations?.length || 0;
      
      // 检测代码审查相关的操作模式
      const editOperations = record.file_operations?.filter(op => op.operation_type === 'edit') || [];
      
      // 短时间内多次编辑同一文件可能表示代码审查和修改过程
      const fileEditCounts = new Map<string, number>();
      editOperations.forEach(op => {
        const count = fileEditCounts.get(op.file_path) || 0;
        fileEditCounts.set(op.file_path, count + 1);
      });

      // 统计迭代编辑模式
      for (const [file, count] of fileEditCounts) {
        if (count >= 3) { // 同一文件编辑3次以上
          iterativeEditPatterns++;
          reviewRelatedOperations += count;
        }
      }
    });

    const reviewIntensity = totalOperations > 0 ? reviewRelatedOperations / totalOperations : 0;

    return {
      reviewIntensity,
      iterativeEditPatterns,
      reviewQuality: this.assessReviewQuality(reviewIntensity, iterativeEditPatterns),
      collaborationLevel: this.assessCollaborationLevel(iterativeEditPatterns)
    };
  }

  private assessReviewQuality(intensity: number, patterns: number): 'high' | 'medium' | 'low' {
    if (intensity > 0.2 && patterns > 5) return 'high';
    if (intensity > 0.1 && patterns > 2) return 'medium';
    return 'low';
  }

  private assessCollaborationLevel(patterns: number): 'active' | 'moderate' | 'minimal' {
    if (patterns > 10) return 'active';
    if (patterns > 3) return 'moderate';
    return 'minimal';
  }

  private calculateOverallQualityScore(metrics: Partial<CodeQualityMetrics>): number {
    const weights = {
      refactoring: 0.25,
      testing: 0.35,
      documentation: 0.25,
      codeReview: 0.15
    };

    let score = 0;
    
    // 重构评分
    if (metrics.refactoringFrequency) {
      const refactoringScore = this.normalizeRefactoringScore(metrics.refactoringFrequency);
      score += refactoringScore * weights.refactoring;
    }
    
    // 测试评分
    if (metrics.testingHabits) {
      const testingScore = this.normalizeTestingScore(metrics.testingHabits);
      score += testingScore * weights.testing;
    }
    
    // 文档评分
    if (metrics.documentationPractice) {
      const docScore = this.normalizeDocumentationScore(metrics.documentationPractice);
      score += docScore * weights.documentation;
    }
    
    // 代码审查评分
    if (metrics.codeReviewPatterns) {
      const reviewScore = this.normalizeReviewScore(metrics.codeReviewPatterns);
      score += reviewScore * weights.codeReview;
    }

    return Math.round(score * 100); // 0-100分
  }

  private normalizeRefactoringScore(metrics: RefactoringMetrics): number {
    // 将重构指标标准化到0-1
    const intensityScore = metrics.refactoringIntensity === 'high' ? 1 : 
                          metrics.refactoringIntensity === 'medium' ? 0.6 : 0.3;
    
    const frequencyScore = Math.min(1, metrics.frequency * 10); // 频率标准化
    
    return (intensityScore + frequencyScore) / 2;
  }

  private normalizeTestingScore(metrics: TestingMetrics): number {
    const coverageScore = Math.min(1, metrics.testCoverage * 5);
    const tddScore = metrics.testDrivenDevelopment === 'strong' ? 1 :
                    metrics.testDrivenDevelopment === 'moderate' ? 0.7 :
                    metrics.testDrivenDevelopment === 'weak' ? 0.4 : 0;
    
    const consistencyScore = metrics.testingConsistency;
    
    return (coverageScore * 0.4 + tddScore * 0.4 + consistencyScore * 0.2);
  }

  private normalizeDocumentationScore(metrics: DocumentationMetrics): number {
    const ratioScore = Math.min(1, metrics.documentationRatio * 10);
    const qualityScore = metrics.documentationQuality === 'excellent' ? 1 :
                        metrics.documentationQuality === 'good' ? 0.8 :
                        metrics.documentationQuality === 'fair' ? 0.6 : 0.3;
    
    return (ratioScore + qualityScore) / 2;
  }

  private normalizeReviewScore(metrics: CodeReviewMetrics): number {
    const intensityScore = Math.min(1, metrics.reviewIntensity * 5);
    const qualityScore = metrics.reviewQuality === 'high' ? 1 :
                        metrics.reviewQuality === 'medium' ? 0.7 : 0.4;
    
    return (intensityScore + qualityScore) / 2;
  }

  private determineQualityRating(score: number): QualityRating {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'average';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private generateQualityRecommendations(metrics: CodeQualityMetrics): string[] {
    const recommendations: string[] = [];

    // 重构建议
    if (metrics.refactoringFrequency.refactoringIntensity === 'low') {
      recommendations.push('建议增加代码重构频率，保持代码质量');
    }

    // 测试建议
    if (metrics.testingHabits.testDrivenDevelopment === 'weak' || metrics.testingHabits.testDrivenDevelopment === 'none') {
      recommendations.push('建议采用测试驱动开发(TDD)实践，先写测试再写实现');
    }

    if (metrics.testingHabits.testCoverage < 0.2) {
      recommendations.push('测试覆盖率较低，建议为核心功能增加更多测试用例');
    }

    // 文档建议
    if (metrics.documentationPractice.documentationQuality === 'poor' || 
        metrics.documentationPractice.documentationQuality === 'fair') {
      recommendations.push('建议完善项目文档，包括README、API文档和代码注释');
    }

    // 代码审查建议
    if (metrics.codeReviewPatterns.reviewQuality === 'low') {
      recommendations.push('建议建立更规范的代码审查流程，提高代码质量');
    }

    return recommendations;
  }
}

/**
 * 性能分析插件
 * 分析开发效率和性能模式
 */
class PerformanceAnalysisPlugin implements AnalyticsPlugin {
  name = 'performance-analyzer';
  version = '1.0.0';
  description = '分析开发性能和效率模式';

  async analyze(data: BasicUsageStats[]): Promise<PerformanceMetrics> {
    return {
      responseTime: this.analyzeResponseTime(data),
      throughput: this.analyzeThroughput(data),
      efficiency: this.analyzeEfficiencyPatterns(data),
      bottlenecks: this.identifyBottlenecks(data),
      performanceScore: 0,
      recommendations: []
    };
  }

  private analyzeResponseTime(data: BasicUsageStats[]): ResponseTimeMetrics {
    const sessionLengths: number[] = [];
    
    data.forEach(record => {
      if (record.active_time_seconds > 0) {
        sessionLengths.push(record.active_time_seconds);
      }
    });

    if (sessionLengths.length === 0) {
      return { average: 0, median: 0, p95: 0, p99: 0 };
    }

    const sorted = sessionLengths.sort((a, b) => a - b);
    const average = sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length;
    const median = this.calculatePercentile(sorted, 50);
    const p95 = this.calculatePercentile(sorted, 95);
    const p99 = this.calculatePercentile(sorted, 99);

    return { average, median, p95, p99 };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private analyzeThroughput(data: BasicUsageStats[]): ThroughputMetrics {
    const totalTokens = data.reduce((sum, record) => sum + record.token_usage.total_tokens, 0);
    const totalTime = data.reduce((sum, record) => sum + record.active_time_seconds, 0);
    const totalSessions = data.length;

    const tokensPerSecond = totalTime > 0 ? totalTokens / totalTime : 0;
    const tokensPerSession = totalSessions > 0 ? totalTokens / totalSessions : 0;
    const sessionsPerHour = totalTime > 0 ? (totalSessions * 3600) / totalTime : 0;

    return {
      tokensPerSecond,
      tokensPerSession,
      sessionsPerHour,
      totalThroughput: totalTokens
    };
  }

  private analyzeEfficiencyPatterns(data: BasicUsageStats[]): EfficiencyPatterns {
    // 分析效率模式：批处理vs单次处理、工作时间分布等
    const batchingSessions = data.filter(record => 
      record.token_usage.total_tokens > 2000 // 大Token会话认为是批处理
    ).length;

    const interactiveSessions = data.length - batchingSessions;
    
    const batchingRatio = data.length > 0 ? batchingSessions / data.length : 0;

    // 分析工作时间模式
    const workHours = this.analyzeWorkHours(data);

    return {
      batchingRatio,
      batchingSessions,
      interactiveSessions,
      workHours,
      efficiency: this.calculateEfficiencyScore(batchingRatio, workHours)
    };
  }

  private analyzeWorkHours(data: BasicUsageStats[]): WorkHoursPattern {
    const hourCounts = new Array(24).fill(0);
    
    data.forEach(record => {
      const hour = new Date(record.timestamp).getHours();
      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const workingHours = hourCounts.reduce((count, sessions, hour) => 
      sessions > 0 ? count + 1 : count, 0
    );

    return {
      peakHour,
      workingHours,
      distribution: hourCounts,
      pattern: this.identifyWorkPattern(hourCounts)
    };
  }

  private identifyWorkPattern(hourCounts: number[]): 'focused' | 'distributed' | 'irregular' {
    const maxSessions = Math.max(...hourCounts);
    const activeSessions = hourCounts.filter(count => count > 0).length;
    const totalSessions = hourCounts.reduce((a, b) => a + b, 0);

    // 计算集中度
    const concentration = maxSessions / totalSessions;
    
    if (concentration > 0.4) return 'focused'; // 40%以上时间集中在某个时段
    if (activeSessions > 12) return 'distributed'; // 超过12个小时都有活动
    return 'irregular';
  }

  private calculateEfficiencyScore(batchingRatio: number, workHours: WorkHoursPattern): number {
    // 基于批处理比例和工作时间模式计算效率分数
    const batchingScore = batchingRatio * 0.3; // 批处理通常更高效
    const focusScore = workHours.pattern === 'focused' ? 0.4 : 
                     workHours.pattern === 'distributed' ? 0.2 : 0.1;
    const utilizationScore = Math.min(0.3, workHours.workingHours / 24 * 0.3);

    return batchingScore + focusScore + utilizationScore;
  }

  private identifyBottlenecks(data: BasicUsageStats[]): BottleneckAnalysis {
    const bottlenecks: Bottleneck[] = [];

    // 分析长时间会话（可能的卡点）
    const longSessions = data.filter(record => record.active_time_seconds > 3600); // 超过1小时
    if (longSessions.length > data.length * 0.1) {
      bottlenecks.push({
        type: 'long_sessions',
        description: '检测到较多长时间会话，可能存在效率问题',
        severity: 'medium',
        affected_sessions: longSessions.length,
        recommendation: '考虑将复杂任务分解为更小的子任务'
      });
    }

    // 分析低Token效率会话
    const lowEfficiencySessions = data.filter(record => 
      record.active_time_seconds > 0 && 
      record.token_usage.total_tokens / record.active_time_seconds < 1 // 每秒少于1个Token
    );
    
    if (lowEfficiencySessions.length > data.length * 0.2) {
      bottlenecks.push({
        type: 'low_token_efficiency',
        description: '检测到Token产出效率较低的会话',
        severity: 'low',
        affected_sessions: lowEfficiencySessions.length,
        recommendation: '优化提示词质量，提高每次交互的效果'
      });
    }

    return {
      total_bottlenecks: bottlenecks.length,
      bottlenecks,
      overall_health: bottlenecks.length === 0 ? 'healthy' : 
                     bottlenecks.length <= 2 ? 'warning' : 'critical'
    };
  }
}

/**
 * 自定义分析服务
 */
class CustomAnalyticsService {
  private dataManager: SimplifiedDataManager;
  private plugins: Map<string, AnalyticsPlugin>;

  constructor() {
    this.dataManager = new SimplifiedDataManager();
    this.plugins = new Map();
    
    // 注册内置插件
    this.registerPlugin(new CodeQualityAnalysisPlugin());
    this.registerPlugin(new PerformanceAnalysisPlugin());
  }

  /**
   * 注册自定义插件
   */
  registerPlugin(plugin: AnalyticsPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * 移除插件
   */
  unregisterPlugin(pluginName: string): boolean {
    return this.plugins.delete(pluginName);
  }

  /**
   * 获取已注册的插件列表
   */
  getPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 运行指定插件分析
   */
  async runPluginAnalysis(pluginName: string, data: BasicUsageStats[]): Promise<any> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    console.log(`🔌 运行插件分析: ${plugin.description}`);
    return await plugin.analyze(data);
  }

  /**
   * 运行所有插件分析
   */
  async runAllPlugins(data: BasicUsageStats[]): Promise<Map<string, any>> {
    const results = new Map();

    for (const [name, plugin] of this.plugins) {
      try {
        const result = await plugin.analyze(data);
        results.set(name, result);
        console.log(`✅ 插件 '${name}' 分析完成`);
      } catch (error) {
        console.error(`❌ 插件 '${name}' 分析失败:`, error);
        results.set(name, { error: error.message });
      }
    }

    return results;
  }

  /**
   * 执行自定义分析流程
   */
  async performCustomAnalysis(options: {
    plugins?: string[];
    includeBuiltinAnalysis?: boolean;
    dateRange?: [Date, Date];
  } = {}): Promise<CustomAnalysisResult> {
    const {
      plugins = Array.from(this.plugins.keys()),
      includeBuiltinAnalysis = true,
      dateRange
    } = options;

    console.log('🚀 开始自定义分析流程...\n');

    try {
      // 获取数据
      const data = await this.dataManager.getUsageStats({
        dateRange,
        includeSystemData: false
      });

      console.log(`📊 获取到 ${data.length} 条数据记录\n`);

      let builtinResults = {};
      
      // 内置分析（如果启用）
      if (includeBuiltinAnalysis) {
        console.log('🔬 执行内置分析...');
        const analytics = new AnalyticsEngine(this.dataManager);
        const basic = await analytics.calculateBasicStats(data);
        const efficiency = await analytics.calculateEfficiencyMetrics(data);
        
        builtinResults = { basic, efficiency };
        console.log('✅ 内置分析完成\n');
      }

      // 插件分析
      console.log('🔌 执行插件分析...');
      const pluginResults = new Map();
      
      for (const pluginName of plugins) {
        if (this.plugins.has(pluginName)) {
          const result = await this.runPluginAnalysis(pluginName, data);
          pluginResults.set(pluginName, result);
        } else {
          console.warn(`⚠️ 插件 '${pluginName}' 未找到`);
        }
      }

      console.log('✅ 所有插件分析完成\n');

      // 生成综合报告
      const summary = this.generateAnalysisSummary(builtinResults, pluginResults);

      return {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalDataPoints: data.length,
          dateRange: dateRange || [
            new Date(data[0]?.timestamp || Date.now()),
            new Date(data[data.length - 1]?.timestamp || Date.now())
          ],
          pluginsUsed: plugins
        },
        builtin: builtinResults,
        plugins: Object.fromEntries(pluginResults),
        summary
      };

    } catch (error) {
      console.error('❌ 自定义分析失败:', error);
      throw error;
    }
  }

  /**
   * 生成分析摘要
   */
  private generateAnalysisSummary(builtin: any, plugins: Map<string, any>): AnalysisSummary {
    const summary: AnalysisSummary = {
      overallScore: 0,
      keyInsights: [],
      recommendations: [],
      strengths: [],
      improvementAreas: []
    };

    // 从代码质量插件获取洞察
    const codeQuality = plugins.get('code-quality-analyzer');
    if (codeQuality) {
      summary.overallScore += codeQuality.overallQualityScore * 0.4;
      summary.keyInsights.push(`代码质量评级: ${codeQuality.qualityRating}`);
      summary.recommendations.push(...codeQuality.recommendations);

      if (codeQuality.overallQualityScore >= 80) {
        summary.strengths.push('代码质量优秀');
      } else if (codeQuality.overallQualityScore < 60) {
        summary.improvementAreas.push('代码质量需要提升');
      }
    }

    // 从性能分析插件获取洞察
    const performance = plugins.get('performance-analyzer');
    if (performance) {
      summary.overallScore += performance.performanceScore * 60; // 标准化
      summary.keyInsights.push(`性能模式: ${performance.efficiency.workHours.pattern}`);
      
      if (performance.bottlenecks.overall_health === 'healthy') {
        summary.strengths.push('性能表现健康');
      } else {
        summary.improvementAreas.push('存在性能瓶颈');
        summary.recommendations.push(...performance.bottlenecks.bottlenecks.map(b => b.recommendation));
      }
    }

    // 从内置分析获取补充信息
    if (builtin.efficiency) {
      summary.keyInsights.push(`生产力评分: ${builtin.efficiency.productivityScore}/10`);
      
      if (builtin.efficiency.productivityScore >= 8) {
        summary.strengths.push('开发效率优秀');
      } else if (builtin.efficiency.productivityScore < 5) {
        summary.improvementAreas.push('开发效率有待提升');
      }
    }

    return summary;
  }
}

// 类型定义
interface CodeQualityMetrics {
  refactoringFrequency: RefactoringMetrics;
  testingHabits: TestingMetrics;
  documentationPractice: DocumentationMetrics;
  codeReviewPatterns: CodeReviewMetrics;
  overallQualityScore: number;
  qualityRating: QualityRating;
  recommendations: string[];
}

interface RefactoringMetrics {
  frequency: number;
  totalRefactoringEvents: number;
  avgRefactoringDuration: number;
  refactoringIntensity: 'low' | 'medium' | 'high';
}

interface TestingMetrics {
  testCoverage: number;
  testWriteRatio: number;
  testFileOperations: number;
  testDrivenDevelopment: 'strong' | 'moderate' | 'weak' | 'none';
  testingConsistency: number;
}

interface DocumentationMetrics {
  documentationRatio: number;
  readmeAttention: number;
  docFileOperations: number;
  documentationQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CodeReviewMetrics {
  reviewIntensity: number;
  iterativeEditPatterns: number;
  reviewQuality: 'high' | 'medium' | 'low';
  collaborationLevel: 'active' | 'moderate' | 'minimal';
}

type QualityRating = 'excellent' | 'good' | 'average' | 'fair' | 'poor';

interface PerformanceMetrics {
  responseTime: ResponseTimeMetrics;
  throughput: ThroughputMetrics;
  efficiency: EfficiencyPatterns;
  bottlenecks: BottleneckAnalysis;
  performanceScore: number;
  recommendations: string[];
}

interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
}

interface ThroughputMetrics {
  tokensPerSecond: number;
  tokensPerSession: number;
  sessionsPerHour: number;
  totalThroughput: number;
}

interface EfficiencyPatterns {
  batchingRatio: number;
  batchingSessions: number;
  interactiveSessions: number;
  workHours: WorkHoursPattern;
  efficiency: number;
}

interface WorkHoursPattern {
  peakHour: number;
  workingHours: number;
  distribution: number[];
  pattern: 'focused' | 'distributed' | 'irregular';
}

interface BottleneckAnalysis {
  total_bottlenecks: number;
  bottlenecks: Bottleneck[];
  overall_health: 'healthy' | 'warning' | 'critical';
}

interface Bottleneck {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affected_sessions: number;
  recommendation: string;
}

interface CustomAnalysisResult {
  metadata: {
    generatedAt: string;
    totalDataPoints: number;
    dateRange: [Date, Date];
    pluginsUsed: string[];
  };
  builtin: any;
  plugins: Record<string, any>;
  summary: AnalysisSummary;
}

interface AnalysisSummary {
  overallScore: number;
  keyInsights: string[];
  recommendations: string[];
  strengths: string[];
  improvementAreas: string[];
}

/**
 * 使用示例
 */
async function runCustomAnalysisExample() {
  console.log('🚀 开始自定义分析示例...\n');

  const customAnalytics = new CustomAnalyticsService();

  try {
    // 执行完整的自定义分析
    const results = await customAnalytics.performCustomAnalysis({
      includeBuiltinAnalysis: true,
      plugins: ['code-quality-analyzer', 'performance-analyzer']
    });

    // 展示结果
    console.log('📋 分析结果摘要:');
    console.log('='.repeat(50));
    console.log(`综合评分: ${results.summary.overallScore.toFixed(1)}/100`);
    console.log('\n🎯 关键洞察:');
    results.summary.keyInsights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight}`);
    });

    console.log('\n💪 优势领域:');
    results.summary.strengths.forEach((strength, index) => {
      console.log(`${index + 1}. ${strength}`);
    });

    console.log('\n🔧 改进建议:');
    results.summary.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    return results;

  } catch (error) {
    console.error('❌ 自定义分析失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runCustomAnalysisExample().catch(console.error);
}

export {
  CustomAnalyticsService,
  CodeQualityAnalysisPlugin,
  PerformanceAnalysisPlugin,
  runCustomAnalysisExample
};