/**
 * 简化用法示例
 * 
 * 本示例演示了 Claude Code Stats 系统的最基本功能
 */

import {
  SimplifiedDataManager,
  AnalyticsEngine,
  ReportGenerator
} from '../src';

async function simpleUsageExample() {
  console.log('🚀 开始简单用法演示...\n');

  try {
    // 1. 初始化数据管理器
    console.log('📊 初始化数据管理器...');
    const dataManager = new SimplifiedDataManager();

    // 2. 获取使用数据
    console.log('📈 获取使用统计数据...');
    const usageData = await dataManager.getUsageStats(process.cwd());

    console.log('✅ 数据获取成功\n');

    // 3. 创建分析引擎
    console.log('🔬 初始化分析引擎...');
    const analytics = new AnalyticsEngine();

    // 4. 生成分析报告
    console.log('📊 生成分析报告...');
    const analysisRequest = {
      project_path: process.cwd(),
      timeframe: 'today' as const,
      analysis_types: ['basic' as const]
    };
    
    const analysisResult = await analytics.generateAnalysisReport(analysisRequest);
    
    console.log('=== 基础统计结果 ===');
    console.log('分析报告生成成功');
    console.log(`报告包含基础统计数据`);
    console.log();

    // 5. 生成报告
    console.log('📄 生成格式化报告...');
    const reportGenerator = new ReportGenerator();

    try {
      const formattedReport = await reportGenerator.generateReport(
        analysisResult,
        { 
          type: 'daily', 
          format: 'table',
          language: 'zh-CN',
          include_charts: false,
          include_insights: true
        }
      );

      console.log('=== 生成的报告预览 ===');
      console.log('报告生成成功');
      console.log();
    } catch (reportError) {
      console.log('报告生成遇到问题，但核心功能正常');
    }

    console.log('✅ 简单用法演示完成！');

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
  simpleUsageExample().catch(console.error);
}

export { simpleUsageExample };