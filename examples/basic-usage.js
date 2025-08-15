"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicUsageExample = basicUsageExample;
const src_1 = require("../src");
async function basicUsageExample() {
    console.log('🚀 开始基础用法演示...\n');
    try {
        console.log('📊 初始化数据管理器...');
        const dataManager = new src_1.SimplifiedDataManager();
        console.log('📈 获取使用统计数据...');
        const usageData = await dataManager.getUsageStats(process.cwd());
        console.log(`✅ 获取到使用数据\n`);
        console.log('🔬 初始化分析引擎...');
        const analytics = new src_1.AnalyticsEngine();
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
        if (analysisResult.efficiency) {
            console.log('=== 效率分析结果 ===');
            console.log(`生产力评分: ${analysisResult.efficiency.productivity_score.toFixed(1)}/10`);
            console.log(`估算代码行数: ${analysisResult.efficiency.estimated_lines_generated}`);
            console.log();
        }
        if (analysisResult.insights && analysisResult.insights.primary_insights.length > 0) {
            console.log('=== 智能洞察 ===');
            analysisResult.insights.primary_insights.slice(0, 3).forEach((insight, index) => {
                console.log(`${index + 1}. ${insight.message}`);
            });
            console.log();
        }
        console.log('📄 生成格式化报告...');
        const reportGenerator = new src_1.ReportGenerator();
        const formattedReport = await reportGenerator.generateReport(analysisResult, 'table', { language: 'zh-CN' });
        console.log('=== 生成的报告预览 ===');
        console.log(formattedReport.content.substring(0, 500) + '...');
        console.log();
        console.log('✅ 基础用法演示完成！');
    }
    catch (error) {
        console.error('❌ 演示过程中发生错误:', error);
        if (error instanceof Error) {
            console.log('错误类型:', error.name);
            console.log('错误消息:', error.message);
        }
    }
}
if (require.main === module) {
    basicUsageExample().catch(console.error);
}
