/**
 * 完整数据分析流程示例
 * 
 * 本示例展示了一个完整的数据分析工作流，包括：
 * 1. 数据获取和验证
 * 2. 多维度分析
 * 3. 趋势识别
 * 4. 异常检测
 * 5. 智能洞察生成
 * 6. 报告导出
 */

import {
  SimplifiedDataManager,
  AnalyticsEngine,
  ReportGenerator,
  TextChartGenerator
} from '../src';
import { BasicUsageStats, FullAnalysisReport } from '../src/types';

/**
 * 完整数据分析类
 */
class ComprehensiveAnalysis {
  private dataManager: SimplifiedDataManager;
  private analytics: AnalyticsEngine;
  private reportGenerator: ReportGenerator;
  private chartGenerator: TextChartGenerator;

  constructor() {
    this.dataManager = new SimplifiedDataManager({
      costApiEnabled: true,
      opentelemetryEnabled: false
    });

    this.analytics = new AnalyticsEngine(this.dataManager, {
      cacheEnabled: true,
      cacheTTL: 600 // 10分钟缓存
    });

    this.reportGenerator = new ReportGenerator({
      language: 'zh-CN',
      cacheEnabled: true
    });

    this.chartGenerator = new TextChartGenerator({
      unicode: true,
      colors: true
    });
  }

  /**
   * 执行完整的数据分析流程
   */
  async performCompleteAnalysis(options: {
    projectPath?: string;
    dateRange?: [Date, Date];
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
    outputDir?: string;
  } = {}) {
    const {
      projectPath = process.cwd(),
      dateRange,
      analysisDepth = 'comprehensive',
      outputDir = './analysis-output'
    } = options;

    console.log('🚀 开始完整数据分析流程...\n');

    try {
      // 第一步：数据获取和验证
      const usageData = await this.collectAndValidateData(projectPath, dateRange);
      
      // 第二步：多维度分析
      const analysisResults = await this.performMultiDimensionalAnalysis(usageData, analysisDepth);
      
      // 第三步：趋势和异常分析
      const trendInsights = await this.analyzeTrendsAndAnomalies(usageData);
      
      // 第四步：生成智能洞察
      const insights = await this.generateIntelligentInsights(analysisResults, trendInsights);
      
      // 第五步：生成可视化图表
      const charts = await this.generateDataVisualizations(analysisResults);
      
      // 第六步：生成和导出报告
      const reports = await this.generateAndExportReports(
        analysisResults,
        insights,
        charts,
        outputDir
      );

      // 第七步：分析总结
      this.displayAnalysisSummary(analysisResults, insights);

      return {
        data: usageData,
        analysis: analysisResults,
        insights,
        charts,
        reports
      };

    } catch (error) {
      console.error('❌ 分析过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 数据收集和验证
   */
  private async collectAndValidateData(
    projectPath: string,
    dateRange?: [Date, Date]
  ): Promise<BasicUsageStats[]> {
    console.log('📊 第一步：数据收集和验证');
    
    // 检查数据源可用性
    const status = await this.dataManager.checkDataSourceAvailability();
    console.log(`  Cost API: ${status.costApi.available ? '✅' : '❌'}`);
    console.log(`  OpenTelemetry: ${status.opentelemetry.available ? '✅' : '❌'}`);

    if (!status.costApi.available) {
      throw new Error('Cost API 不可用，无法进行数据分析');
    }

    // 获取使用数据
    console.log('  获取使用数据...');
    const usageData = await this.dataManager.getUsageStats({
      projectPath,
      dateRange,
      includeSystemData: false
    });

    console.log(`  ✅ 获取到 ${usageData.length} 条有效记录`);

    // 数据质量验证
    const validData = this.validateDataQuality(usageData);
    console.log(`  ✅ 数据质量验证完成，${validData.length} 条记录通过验证\n`);

    return validData;
  }

  /**
   * 数据质量验证
   */
  private validateDataQuality(data: BasicUsageStats[]): BasicUsageStats[] {
    return data.filter(record => {
      // 检查必要字段
      if (!record.session_id || !record.timestamp) return false;
      
      // 检查时间合理性
      if (record.active_time_seconds < 0 || record.active_time_seconds > 24 * 3600) return false;
      
      // 检查Token数据合理性
      if (record.token_usage.total_tokens < 0 || record.token_usage.total_tokens > 1000000) return false;
      
      // 检查成本数据合理性
      if (record.cost_info.total_cost < 0 || record.cost_info.total_cost > 100) return false;
      
      return true;
    });
  }

  /**
   * 多维度分析
   */
  private async performMultiDimensionalAnalysis(
    data: BasicUsageStats[],
    depth: 'basic' | 'detailed' | 'comprehensive'
  ) {
    console.log('🔬 第二步：多维度分析');

    // 基础统计分析
    console.log('  计算基础统计指标...');
    const basicStats = await this.analytics.calculateBasicStats(data);
    
    // 效率分析
    console.log('  分析工作效率...');
    const efficiency = await this.analytics.calculateEfficiencyMetrics(data);
    
    // 工具使用分析
    console.log('  分析工具使用模式...');
    const toolAnalysis = this.analyzeToolUsagePatterns(data);
    
    // 时间模式分析
    console.log('  分析时间使用模式...');
    const timePatterns = this.analyzeTimePatterns(data);

    let advancedAnalysis = {};
    
    if (depth === 'detailed' || depth === 'comprehensive') {
      // 成本深度分析
      console.log('  深度成本分析...');
      advancedAnalysis = {
        ...advancedAnalysis,
        costBreakdown: this.analyzeCostBreakdown(data),
        modelUsageAnalysis: this.analyzeModelUsage(data)
      };
    }
    
    if (depth === 'comprehensive') {
      // 综合效率评估
      console.log('  综合效率评估...');
      advancedAnalysis = {
        ...advancedAnalysis,
        productivityIndex: this.calculateProductivityIndex(basicStats, efficiency, timePatterns),
        performanceBenchmarks: this.calculatePerformanceBenchmarks(data)
      };
    }

    console.log('  ✅ 多维度分析完成\n');

    return {
      basic: basicStats,
      efficiency,
      toolAnalysis,
      timePatterns,
      ...advancedAnalysis
    };
  }

  /**
   * 工具使用模式分析
   */
  private analyzeToolUsagePatterns(data: BasicUsageStats[]) {
    const toolStats = new Map<string, {
      count: number;
      totalTime: number;
      avgTime: number;
      efficiency: number;
    }>();

    data.forEach(record => {
      record.tool_usage?.forEach(tool => {
        const existing = toolStats.get(tool.tool_name) || {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          efficiency: 0
        };

        existing.count++;
        existing.totalTime += tool.duration_seconds || 0;
        toolStats.set(tool.tool_name, existing);
      });
    });

    // 计算平均时间和效率
    for (const [toolName, stats] of toolStats) {
      stats.avgTime = stats.totalTime / stats.count;
      // 效率计算：基于使用频率和平均时间
      stats.efficiency = Math.min(1, stats.count / stats.avgTime * 100);
    }

    return {
      toolDistribution: Array.from(toolStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count),
      mostUsedTool: Array.from(toolStats.entries())
        .sort((a, b) => b[1].count - a[1].count)[0]?.[0],
      mostEfficientTool: Array.from(toolStats.entries())
        .sort((a, b) => b[1].efficiency - a[1].efficiency)[0]?.[0]
    };
  }

  /**
   * 时间模式分析
   */
  private analyzeTimePatterns(data: BasicUsageStats[]) {
    const hourlyDistribution = new Array(24).fill(0);
    const weeklyDistribution = new Array(7).fill(0);
    
    data.forEach(record => {
      const date = new Date(record.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      hourlyDistribution[hour] += record.active_time_seconds;
      weeklyDistribution[dayOfWeek] += record.active_time_seconds;
    });

    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    const peakDay = weeklyDistribution.indexOf(Math.max(...weeklyDistribution));
    
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    return {
      hourlyDistribution,
      weeklyDistribution,
      peakProductivityHour: peakHour,
      peakProductivityDay: dayNames[peakDay],
      workingHours: this.identifyWorkingHours(hourlyDistribution),
      workPattern: this.identifyWorkPattern(weeklyDistribution)
    };
  }

  /**
   * 识别工作时间段
   */
  private identifyWorkingHours(hourlyDist: number[]) {
    const threshold = Math.max(...hourlyDist) * 0.1; // 10%阈值
    const workingHours = [];
    
    for (let i = 0; i < 24; i++) {
      if (hourlyDist[i] > threshold) {
        workingHours.push(i);
      }
    }
    
    return workingHours;
  }

  /**
   * 识别工作模式
   */
  private identifyWorkPattern(weeklyDist: number[]) {
    const weekdayTotal = weeklyDist.slice(1, 6).reduce((a, b) => a + b, 0);
    const weekendTotal = weeklyDist[0] + weeklyDist[6];
    
    if (weekendTotal / (weekdayTotal + weekendTotal) > 0.3) {
      return '全天候工作模式';
    } else {
      return '工作日模式';
    }
  }

  /**
   * 成本分解分析
   */
  private analyzeCostBreakdown(data: BasicUsageStats[]) {
    const modelCosts = new Map<string, number>();
    let totalCost = 0;

    data.forEach(record => {
      totalCost += record.cost_info.total_cost;
      
      record.cost_info.model_costs?.forEach(modelCost => {
        const existing = modelCosts.get(modelCost.model) || 0;
        modelCosts.set(modelCost.model, existing + modelCost.cost);
      });
    });

    return {
      totalCost,
      modelBreakdown: Array.from(modelCosts.entries())
        .map(([model, cost]) => ({
          model,
          cost,
          percentage: (cost / totalCost) * 100
        }))
        .sort((a, b) => b.cost - a.cost),
      averageCostPerSession: totalCost / data.length,
      costTrend: this.calculateCostTrend(data)
    };
  }

  /**
   * 计算成本趋势
   */
  private calculateCostTrend(data: BasicUsageStats[]) {
    if (data.length < 2) return { direction: 'stable', change: 0 };

    const sortedData = data.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstHalf = sortedData.slice(0, Math.floor(data.length / 2));
    const secondHalf = sortedData.slice(Math.floor(data.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, record) => 
      sum + record.cost_info.total_cost, 0) / firstHalf.length;
    
    const secondHalfAvg = secondHalf.reduce((sum, record) => 
      sum + record.cost_info.total_cost, 0) / secondHalf.length;

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    return {
      direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.abs(change),
      firstPeriodAvg: firstHalfAvg,
      secondPeriodAvg: secondHalfAvg
    };
  }

  /**
   * 模型使用分析
   */
  private analyzeModelUsage(data: BasicUsageStats[]) {
    const modelUsage = new Map<string, {
      sessions: number;
      totalTokens: number;
      totalCost: number;
      avgTokensPerSession: number;
      avgCostPerSession: number;
    }>();

    data.forEach(record => {
      record.cost_info.model_costs?.forEach(modelCost => {
        const existing = modelUsage.get(modelCost.model) || {
          sessions: 0,
          totalTokens: 0,
          totalCost: 0,
          avgTokensPerSession: 0,
          avgCostPerSession: 0
        };

        existing.sessions++;
        existing.totalTokens += record.token_usage.total_tokens;
        existing.totalCost += modelCost.cost;
        
        modelUsage.set(modelCost.model, existing);
      });
    });

    // 计算平均值
    for (const [model, usage] of modelUsage) {
      usage.avgTokensPerSession = usage.totalTokens / usage.sessions;
      usage.avgCostPerSession = usage.totalCost / usage.sessions;
    }

    return Array.from(modelUsage.entries())
      .map(([model, usage]) => ({ model, ...usage }))
      .sort((a, b) => b.sessions - a.sessions);
  }

  /**
   * 计算生产力指数
   */
  private calculateProductivityIndex(basicStats: any, efficiency: any, timePatterns: any) {
    // 基于多个维度计算综合生产力指数
    const factors = {
      tokenEfficiency: Math.min(1, efficiency.tokensPerHour / 3000), // 标准化到3000 tokens/hour
      timeUtilization: Math.min(1, basicStats.totalActiveTime / (8 * 30 * 3600)), // 标准化到月工作时间
      toolEfficiency: efficiency.toolAnalysis?.efficiency || 0.5,
      consistencyBonus: this.calculateConsistencyBonus(timePatterns.weeklyDistribution)
    };

    const weightedScore = (
      factors.tokenEfficiency * 0.4 +
      factors.timeUtilization * 0.3 +
      factors.toolEfficiency * 0.2 +
      factors.consistencyBonus * 0.1
    );

    return {
      overallIndex: Math.round(weightedScore * 100),
      factors,
      rating: this.getProductivityRating(weightedScore),
      recommendations: this.generateProductivityRecommendations(factors)
    };
  }

  /**
   * 计算一致性加分
   */
  private calculateConsistencyBonus(weeklyDist: number[]) {
    const variance = this.calculateVariance(weeklyDist);
    const mean = weeklyDist.reduce((a, b) => a + b, 0) / weeklyDist.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    // 一致性越高，CV越小，加分越多
    return Math.max(0, 1 - coefficientOfVariation);
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * 获取生产力评级
   */
  private getProductivityRating(score: number) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'average';
    return 'needs_improvement';
  }

  /**
   * 生成生产力建议
   */
  private generateProductivityRecommendations(factors: any) {
    const recommendations = [];

    if (factors.tokenEfficiency < 0.6) {
      recommendations.push('考虑优化提示词质量，提高每次交互的效果');
    }

    if (factors.timeUtilization < 0.5) {
      recommendations.push('增加系统使用频率，更充分利用开发工具');
    }

    if (factors.toolEfficiency < 0.7) {
      recommendations.push('学习更多工具使用技巧，提高工具操作效率');
    }

    if (factors.consistencyBonus < 0.5) {
      recommendations.push('建立更稳定的工作节奏，保持一致的开发习惯');
    }

    return recommendations;
  }

  /**
   * 计算性能基准
   */
  private calculatePerformanceBenchmarks(data: BasicUsageStats[]) {
    // 这里可以与行业标准或历史数据进行比较
    const benchmarks = {
      tokenEfficiencyPercentile: 75, // 假设用户处于75%分位
      costEfficiencyPercentile: 80,  // 成本控制较好
      toolUsagePercentile: 60,       // 工具使用一般
      timeUtilizationPercentile: 70  // 时间利用良好
    };

    return {
      ...benchmarks,
      overallRanking: Math.round((
        benchmarks.tokenEfficiencyPercentile +
        benchmarks.costEfficiencyPercentile +
        benchmarks.toolUsagePercentile +
        benchmarks.timeUtilizationPercentile
      ) / 4),
      strongPoints: this.identifyStrongPoints(benchmarks),
      improvementAreas: this.identifyImprovementAreas(benchmarks)
    };
  }

  /**
   * 识别优势领域
   */
  private identifyStrongPoints(benchmarks: any) {
    const strongPoints = [];
    
    if (benchmarks.tokenEfficiencyPercentile >= 80) {
      strongPoints.push('Token使用效率');
    }
    if (benchmarks.costEfficiencyPercentile >= 80) {
      strongPoints.push('成本控制');
    }
    if (benchmarks.toolUsagePercentile >= 80) {
      strongPoints.push('工具使用');
    }
    if (benchmarks.timeUtilizationPercentile >= 80) {
      strongPoints.push('时间管理');
    }

    return strongPoints;
  }

  /**
   * 识别改进领域
   */
  private identifyImprovementAreas(benchmarks: any) {
    const improvementAreas = [];
    
    if (benchmarks.tokenEfficiencyPercentile < 50) {
      improvementAreas.push('Token使用效率');
    }
    if (benchmarks.costEfficiencyPercentile < 50) {
      improvementAreas.push('成本控制');
    }
    if (benchmarks.toolUsagePercentile < 50) {
      improvementAreas.push('工具使用');
    }
    if (benchmarks.timeUtilizationPercentile < 50) {
      improvementAreas.push('时间管理');
    }

    return improvementAreas;
  }

  /**
   * 趋势和异常分析
   */
  private async analyzeTrendsAndAnomalies(data: BasicUsageStats[]) {
    console.log('📈 第三步：趋势和异常分析');
    
    const trends = await this.analytics.analyzeTrends(data, {
      includeSeasonality: true,
      detectAnomalies: true,
      confidenceLevel: 0.95
    });

    console.log('  ✅ 趋势分析完成\n');
    return trends;
  }

  /**
   * 生成智能洞察
   */
  private async generateIntelligentInsights(analysisResults: any, trendInsights: any) {
    console.log('🧠 第四步：生成智能洞察');
    
    const insights = await this.analytics.generateInsights(
      analysisResults.basic,
      analysisResults.efficiency,
      trendInsights,
      {
        includeRecommendations: true,
        prioritizeActionable: true,
        customRules: ['efficiency', 'cost', 'productivity']
      }
    );

    console.log('  ✅ 智能洞察生成完成\n');
    return insights;
  }

  /**
   * 生成数据可视化
   */
  private async generateDataVisualizations(analysisResults: any) {
    console.log('📊 第五步：生成数据可视化');

    const charts = {
      // Token使用趋势图
      tokenTrend: this.chartGenerator.generateLineChart(
        this.prepareTokenTrendData(analysisResults.basic),
        { title: 'Token使用趋势', width: 60, height: 15 }
      ),

      // 工具使用分布图
      toolDistribution: this.chartGenerator.generateBarChart(
        analysisResults.toolAnalysis.toolDistribution.slice(0, 5).map((tool: any) => ({
          name: tool.name,
          value: tool.count
        })),
        { title: '工具使用分布', width: 50, height: 12 }
      ),

      // 时间分布饼图
      timeDistribution: this.chartGenerator.generatePieChart(
        analysisResults.timePatterns.hourlyDistribution
          .map((hours: number, index: number) => ({
            name: `${index}:00`,
            value: hours
          }))
          .filter((item: any) => item.value > 0)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 6),
        { title: '活跃时间分布' }
      )
    };

    console.log('  ✅ 数据可视化完成\n');
    return charts;
  }

  /**
   * 准备Token趋势数据
   */
  private prepareTokenTrendData(basicStats: any) {
    // 这里应该基于实际的时间序列数据
    // 为演示目的，生成模拟数据
    return [
      { name: '第1周', value: 18500 },
      { name: '第2周', value: 22300 },
      { name: '第3周', value: 19800 },
      { name: '第4周', value: 25600 },
      { name: '第5周', value: 28400 }
    ];
  }

  /**
   * 生成和导出报告
   */
  private async generateAndExportReports(
    analysisResults: any,
    insights: any,
    charts: any,
    outputDir: string
  ) {
    console.log('📄 第六步：生成和导出报告');

    // 创建输出目录
    const fs = await import('fs');
    const path = await import('path');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 构建完整报告数据
    const fullReport: FullAnalysisReport = {
      metadata: {
        generatedAt: new Date().toISOString(),
        projectPath: process.cwd(),
        dataRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        totalDataPoints: 100 // 示例数据
      },
      basic: analysisResults.basic,
      efficiency: analysisResults.efficiency,
      trends: analysisResults.trendInsights || {},
      insights: insights,
      costs: analysisResults.costBreakdown || {}
    };

    // 生成不同格式的报告
    const reports = {
      detailed: await this.reportGenerator.generateReport(fullReport, 'detailed'),
      summary: await this.reportGenerator.generateReport(fullReport, 'simple'),
      json: await this.reportGenerator.generateReport(fullReport, 'json'),
      markdown: await this.reportGenerator.generateReport(fullReport, 'markdown')
    };

    // 导出报告文件
    for (const [format, report] of Object.entries(reports)) {
      const fileName = `analysis-report.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'}`;
      const filePath = path.join(outputDir, fileName);
      
      fs.writeFileSync(filePath, report.content, 'utf-8');
      console.log(`  ✅ ${format} 报告已导出: ${filePath}`);
    }

    // 导出图表
    const chartsPath = path.join(outputDir, 'charts.txt');
    const chartContent = Object.entries(charts)
      .map(([name, chart]) => `=== ${name.toUpperCase()} ===\n${chart}\n`)
      .join('\n');
    
    fs.writeFileSync(chartsPath, chartContent, 'utf-8');
    console.log(`  ✅ 图表已导出: ${chartsPath}`);

    console.log('  ✅ 报告导出完成\n');
    
    return { reports, outputDir, files: Object.keys(reports).length + 1 };
  }

  /**
   * 显示分析总结
   */
  private displayAnalysisSummary(analysisResults: any, insights: any) {
    console.log('📋 第七步：分析总结');
    console.log('='.repeat(60));
    console.log('🎯 核心指标摘要:');
    console.log(`├─ 总会话数: ${analysisResults.basic.totalSessions}`);
    console.log(`├─ 总活跃时间: ${(analysisResults.basic.totalActiveTime / 3600).toFixed(1)} 小时`);
    console.log(`├─ 生产力评分: ${analysisResults.efficiency.productivityScore.toFixed(1)}/10`);
    console.log(`└─ 效率等级: ${analysisResults.efficiency.efficiencyRating}`);
    console.log('');

    if (analysisResults.productivityIndex) {
      console.log('📊 生产力分析:');
      console.log(`├─ 综合指数: ${analysisResults.productivityIndex.overallIndex}/100`);
      console.log(`├─ 评级: ${analysisResults.productivityIndex.rating}`);
      console.log(`└─ 排名: 前${100 - analysisResults.performanceBenchmarks.overallRanking}%`);
      console.log('');
    }

    console.log('💡 关键洞察:');
    if (insights.primaryInsights && insights.primaryInsights.length > 0) {
      insights.primaryInsights.slice(0, 3).forEach((insight: any, index: number) => {
        console.log(`${index + 1}. ${insight.message}`);
      });
    }
    console.log('');

    console.log('🎊 分析完成！所有报告已生成并导出。');
    console.log('='.repeat(60));
  }
}

/**
 * 执行完整分析的便捷函数
 */
async function runCompleteAnalysis() {
  const analyzer = new ComprehensiveAnalysis();
  
  try {
    const results = await analyzer.performCompleteAnalysis({
      analysisDepth: 'comprehensive',
      outputDir: './analysis-results'
    });

    console.log('\n🚀 分析完成！');
    console.log(`📊 数据点: ${results.data.length}`);
    console.log(`📄 报告文件: ${results.reports.files}`);
    console.log(`📁 输出目录: ${results.reports.outputDir}`);

    return results;
  } catch (error) {
    console.error('分析失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行分析
if (require.main === module) {
  runCompleteAnalysis().catch(console.error);
}

export { ComprehensiveAnalysis, runCompleteAnalysis };