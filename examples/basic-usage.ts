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
    const dataManager = new SimplifiedDataManager();

    // 2. 获取使用数据
    console.log('📈 获取使用统计数据...');
    const usageData = await dataManager.getUsageStats(process.cwd());

    console.log(`✅ 获取到使用数据\n`);

    // 3. 创建分析引擎
    console.log('🔬 初始化分析引擎...');
    const analytics = new AnalyticsEngine();

    // 4. 生成完整分析报告
    console.log('📊 生成分析报告...');
    const analysisRequest = {
      project_path: process.cwd(),
      timeframe: 'today',
      analysis_types: ['basic', 'efficiency', 'trends', 'insights']
    };
    
    const analysisResult = await analytics.generateAnalysisReport(analysisRequest);
    
    console.log('=== 基础统计结果 ===');
    console.log(`总请求数: ${analysisResult.basic_stats.total_requests}`);
    console.log(`总Token数: ${analysisResult.basic_stats.total_tokens.toLocaleString()}`);
    console.log(`总成本: $${analysisResult.basic_stats.total_cost.toFixed(4)}`);
    console.log();

    // 5. 显示效率指标
    if (analysisResult.efficiency) {
      console.log('=== 效率分析结果 ===');
      console.log(`生产力评分: ${analysisResult.efficiency.productivity_score.toFixed(1)}/10`);
      console.log(`估算代码行数: ${analysisResult.efficiency.estimated_lines_generated}`);
      console.log();
    }

    // 6. 显示智能洞察
    if (analysisResult.insights && analysisResult.insights.primary_insights.length > 0) {
      console.log('=== 智能洞察 ===');
      analysisResult.insights.primary_insights.slice(0, 3).forEach((insight, index) => {
        console.log(`${index + 1}. ${insight.message}`);
      });
      console.log();
    }

    // 7. 生成报告
    console.log('📄 生成格式化报告...');
    const reportGenerator = new ReportGenerator();

    const formattedReport = await reportGenerator.generateReport(
      analysisResult,
      'table',
      { language: 'zh-CN' }
    );

    console.log('=== 生成的报告预览 ===');
    console.log(formattedReport.content.substring(0, 500) + '...');
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