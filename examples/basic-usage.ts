/**
 * 基础用法示例
 * 
 * 本示例演示了 Claude Code Stats 系统的基本功能，包括：
 * 1. 数据源初始化和检查
 * 2. 使用数据获取
 * 3. 基础统计计算
 * 4. 报告生成
 */

import {
  SimplifiedDataManager,
  AnalyticsEngine,
  ReportGenerator
} from '../src';

async function basicUsageExample() {
  console.log('🚀 开始基础用法演示...\n');

  try {
    // 1. 初始化数据管理器
    console.log('📊 初始化数据管理器...');
    const dataManager = new SimplifiedDataManager({
      costApiEnabled: true,
      opentelemetryEnabled: false,
      projectPath: process.cwd()
    });

    // 2. 检查数据源可用性
    console.log('🔍 检查数据源可用性...');
    const status = await dataManager.checkDataSourceAvailability();
    
    console.log(`Cost API: ${status.costApi.available ? '✅ 可用' : '❌ 不可用'}`);
    console.log(`OpenTelemetry: ${status.opentelemetry.available ? '✅ 可用' : '❌ 不可用'}`);
    
    if (status.recommendations.length > 0) {
      console.log('💡 建议:', status.recommendations.join(', '));
    }
    console.log();

    // 3. 获取使用数据
    console.log('📈 获取使用统计数据...');
    const usageData = await dataManager.getUsageStats({
      includeSystemData: false
    });

    console.log(`✅ 获取到 ${usageData.length} 条使用记录\n`);

    // 4. 创建分析引擎
    console.log('🔬 初始化分析引擎...');
    const analytics = new AnalyticsEngine(dataManager, {
      cacheEnabled: true,
      cacheTTL: 300
    });

    // 5. 生成基础统计
    console.log('📊 计算基础统计信息...');
    const basicStats = await analytics.calculateBasicStats(usageData);
    
    console.log('=== 基础统计结果 ===');
    console.log(`总会话数: ${basicStats.totalSessions}`);
    console.log(`总活跃时间: ${(basicStats.totalActiveTime / 3600).toFixed(2)} 小时`);
    console.log(`总Token数: ${basicStats.totalTokens.toLocaleString()}`);
    console.log(`总成本: $${basicStats.totalCost.toFixed(4)}`);
    console.log(`处理文件数: ${basicStats.totalFiles}`);
    console.log();

    // 6. 计算效率指标
    console.log('⚡ 计算效率指标...');
    const efficiency = await analytics.calculateEfficiencyMetrics(usageData);
    
    console.log('=== 效率分析结果 ===');
    console.log(`每小时Token数: ${efficiency.tokensPerHour.toFixed(0)}`);
    console.log(`估算每小时代码行数: ${efficiency.estimatedLinesPerHour.toFixed(0)}`);
    console.log(`生产力评分: ${efficiency.productivityScore.toFixed(1)}/10`);
    console.log(`效率等级: ${efficiency.efficiencyRating}`);
    console.log();

    // 7. 生成智能洞察
    console.log('🧠 生成智能洞察...');
    const trends = await analytics.analyzeTrends(usageData);
    const insights = await analytics.generateInsights(basicStats, efficiency, trends);
    
    console.log('=== 智能洞察 ===');
    if (insights.primaryInsights.length > 0) {
      insights.primaryInsights.slice(0, 3).forEach((insight, index) => {
        console.log(`${index + 1}. ${insight.message}`);
      });
    }
    console.log();

    // 8. 生成报告
    console.log('📄 生成报告...');
    const reportGenerator = new ReportGenerator({
      language: 'zh-CN',
      cacheEnabled: true
    });

    const fullReport = await analytics.generateFullReport(usageData);
    const formattedReport = await reportGenerator.generateReport(
      fullReport,
      'table'
    );

    console.log('=== 生成的报告预览 ===');
    console.log(formattedReport.content.substring(0, 500) + '...');
    console.log();

    // 9. 展示不同格式的报告
    console.log('📊 展示不同格式的报告...');
    
    // 简要格式
    const simpleReport = await reportGenerator.generateReport(fullReport, 'simple');
    console.log('=== 简要格式 ===');
    console.log(simpleReport.content);
    console.log();

    // JSON格式（用于程序处理）
    const jsonReport = await reportGenerator.generateReport(fullReport, 'json');
    const jsonData = JSON.parse(jsonReport.content);
    console.log('=== JSON格式数据结构 ===');
    console.log(`数据点: ${jsonData.metadata.totalDataPoints}`);
    console.log(`时间范围: ${jsonData.metadata.dataRange.start} 到 ${jsonData.metadata.dataRange.end}`);
    console.log();

    console.log('✅ 基础用法演示完成！');

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
    
    // 展示错误处理
    if (error instanceof Error) {
      console.log('错误类型:', error.name);
      console.log('错误消息:', error.message);
    }
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };