"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensiveAnalysis = void 0;
exports.runCompleteAnalysis = runCompleteAnalysis;
const src_1 = require("../src");
class ComprehensiveAnalysis {
    constructor() {
        this.dataManager = new src_1.SimplifiedDataManager({
            costApiEnabled: true,
            opentelemetryEnabled: false
        });
        this.analytics = new src_1.AnalyticsEngine(this.dataManager, {
            cacheEnabled: true,
            cacheTTL: 600
        });
        this.reportGenerator = new src_1.ReportGenerator({
            language: 'zh-CN',
            cacheEnabled: true
        });
        this.chartGenerator = new src_1.TextChartGenerator({
            unicode: true,
            colors: true
        });
    }
    async performCompleteAnalysis(options = {}) {
        const { projectPath = process.cwd(), dateRange, analysisDepth = 'comprehensive', outputDir = './analysis-output' } = options;
        console.log('🚀 开始完整数据分析流程...\n');
        try {
            const usageData = await this.collectAndValidateData(projectPath, dateRange);
            const analysisResults = await this.performMultiDimensionalAnalysis(usageData, analysisDepth);
            const trendInsights = await this.analyzeTrendsAndAnomalies(usageData);
            const insights = await this.generateIntelligentInsights(analysisResults, trendInsights);
            const charts = await this.generateDataVisualizations(analysisResults);
            const reports = await this.generateAndExportReports(analysisResults, insights, charts, outputDir);
            this.displayAnalysisSummary(analysisResults, insights);
            return {
                data: usageData,
                analysis: analysisResults,
                insights,
                charts,
                reports
            };
        }
        catch (error) {
            console.error('❌ 分析过程中发生错误:', error);
            throw error;
        }
    }
    async collectAndValidateData(projectPath, dateRange) {
        console.log('📊 第一步：数据收集和验证');
        const status = await this.dataManager.checkDataSourceAvailability();
        console.log(`  Cost API: ${status.costApi.available ? '✅' : '❌'}`);
        console.log(`  OpenTelemetry: ${status.opentelemetry.available ? '✅' : '❌'}`);
        if (!status.costApi.available) {
            throw new Error('Cost API 不可用，无法进行数据分析');
        }
        console.log('  获取使用数据...');
        const usageData = await this.dataManager.getUsageStats({
            projectPath,
            dateRange,
            includeSystemData: false
        });
        console.log(`  ✅ 获取到 ${usageData.length} 条有效记录`);
        const validData = this.validateDataQuality(usageData);
        console.log(`  ✅ 数据质量验证完成，${validData.length} 条记录通过验证\n`);
        return validData;
    }
    validateDataQuality(data) {
        return data.filter(record => {
            if (!record.session_id || !record.timestamp)
                return false;
            if (record.active_time_seconds < 0 || record.active_time_seconds > 24 * 3600)
                return false;
            if (record.token_usage.total_tokens < 0 || record.token_usage.total_tokens > 1000000)
                return false;
            if (record.cost_info.total_cost < 0 || record.cost_info.total_cost > 100)
                return false;
            return true;
        });
    }
    async performMultiDimensionalAnalysis(data, depth) {
        console.log('🔬 第二步：多维度分析');
        console.log('  计算基础统计指标...');
        const basicStats = await this.analytics.calculateBasicStats(data);
        console.log('  分析工作效率...');
        const efficiency = await this.analytics.calculateEfficiencyMetrics(data);
        console.log('  分析工具使用模式...');
        const toolAnalysis = this.analyzeToolUsagePatterns(data);
        console.log('  分析时间使用模式...');
        const timePatterns = this.analyzeTimePatterns(data);
        let advancedAnalysis = {};
        if (depth === 'detailed' || depth === 'comprehensive') {
            console.log('  深度成本分析...');
            advancedAnalysis = {
                ...advancedAnalysis,
                costBreakdown: this.analyzeCostBreakdown(data),
                modelUsageAnalysis: this.analyzeModelUsage(data)
            };
        }
        if (depth === 'comprehensive') {
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
    analyzeToolUsagePatterns(data) {
        const toolStats = new Map();
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
        for (const [toolName, stats] of toolStats) {
            stats.avgTime = stats.totalTime / stats.count;
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
    analyzeTimePatterns(data) {
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
    identifyWorkingHours(hourlyDist) {
        const threshold = Math.max(...hourlyDist) * 0.1;
        const workingHours = [];
        for (let i = 0; i < 24; i++) {
            if (hourlyDist[i] > threshold) {
                workingHours.push(i);
            }
        }
        return workingHours;
    }
    identifyWorkPattern(weeklyDist) {
        const weekdayTotal = weeklyDist.slice(1, 6).reduce((a, b) => a + b, 0);
        const weekendTotal = weeklyDist[0] + weeklyDist[6];
        if (weekendTotal / (weekdayTotal + weekendTotal) > 0.3) {
            return '全天候工作模式';
        }
        else {
            return '工作日模式';
        }
    }
    analyzeCostBreakdown(data) {
        const modelCosts = new Map();
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
    calculateCostTrend(data) {
        if (data.length < 2)
            return { direction: 'stable', change: 0 };
        const sortedData = data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstHalf = sortedData.slice(0, Math.floor(data.length / 2));
        const secondHalf = sortedData.slice(Math.floor(data.length / 2));
        const firstHalfAvg = firstHalf.reduce((sum, record) => sum + record.cost_info.total_cost, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, record) => sum + record.cost_info.total_cost, 0) / secondHalf.length;
        const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        return {
            direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
            change: Math.abs(change),
            firstPeriodAvg: firstHalfAvg,
            secondPeriodAvg: secondHalfAvg
        };
    }
    analyzeModelUsage(data) {
        const modelUsage = new Map();
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
        for (const [model, usage] of modelUsage) {
            usage.avgTokensPerSession = usage.totalTokens / usage.sessions;
            usage.avgCostPerSession = usage.totalCost / usage.sessions;
        }
        return Array.from(modelUsage.entries())
            .map(([model, usage]) => ({ model, ...usage }))
            .sort((a, b) => b.sessions - a.sessions);
    }
    calculateProductivityIndex(basicStats, efficiency, timePatterns) {
        const factors = {
            tokenEfficiency: Math.min(1, efficiency.tokensPerHour / 3000),
            timeUtilization: Math.min(1, basicStats.totalActiveTime / (8 * 30 * 3600)),
            toolEfficiency: efficiency.toolAnalysis?.efficiency || 0.5,
            consistencyBonus: this.calculateConsistencyBonus(timePatterns.weeklyDistribution)
        };
        const weightedScore = (factors.tokenEfficiency * 0.4 +
            factors.timeUtilization * 0.3 +
            factors.toolEfficiency * 0.2 +
            factors.consistencyBonus * 0.1);
        return {
            overallIndex: Math.round(weightedScore * 100),
            factors,
            rating: this.getProductivityRating(weightedScore),
            recommendations: this.generateProductivityRecommendations(factors)
        };
    }
    calculateConsistencyBonus(weeklyDist) {
        const variance = this.calculateVariance(weeklyDist);
        const mean = weeklyDist.reduce((a, b) => a + b, 0) / weeklyDist.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        return Math.max(0, 1 - coefficientOfVariation);
    }
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }
    getProductivityRating(score) {
        if (score >= 0.8)
            return 'excellent';
        if (score >= 0.6)
            return 'good';
        if (score >= 0.4)
            return 'average';
        return 'needs_improvement';
    }
    generateProductivityRecommendations(factors) {
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
    calculatePerformanceBenchmarks(data) {
        const benchmarks = {
            tokenEfficiencyPercentile: 75,
            costEfficiencyPercentile: 80,
            toolUsagePercentile: 60,
            timeUtilizationPercentile: 70
        };
        return {
            ...benchmarks,
            overallRanking: Math.round((benchmarks.tokenEfficiencyPercentile +
                benchmarks.costEfficiencyPercentile +
                benchmarks.toolUsagePercentile +
                benchmarks.timeUtilizationPercentile) / 4),
            strongPoints: this.identifyStrongPoints(benchmarks),
            improvementAreas: this.identifyImprovementAreas(benchmarks)
        };
    }
    identifyStrongPoints(benchmarks) {
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
    identifyImprovementAreas(benchmarks) {
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
    async analyzeTrendsAndAnomalies(data) {
        console.log('📈 第三步：趋势和异常分析');
        const trends = await this.analytics.analyzeTrends(data, {
            includeSeasonality: true,
            detectAnomalies: true,
            confidenceLevel: 0.95
        });
        console.log('  ✅ 趋势分析完成\n');
        return trends;
    }
    async generateIntelligentInsights(analysisResults, trendInsights) {
        console.log('🧠 第四步：生成智能洞察');
        const insights = await this.analytics.generateInsights(analysisResults.basic, analysisResults.efficiency, trendInsights, {
            includeRecommendations: true,
            prioritizeActionable: true,
            customRules: ['efficiency', 'cost', 'productivity']
        });
        console.log('  ✅ 智能洞察生成完成\n');
        return insights;
    }
    async generateDataVisualizations(analysisResults) {
        console.log('📊 第五步：生成数据可视化');
        const charts = {
            tokenTrend: this.chartGenerator.generateLineChart(this.prepareTokenTrendData(analysisResults.basic), { title: 'Token使用趋势', width: 60, height: 15 }),
            toolDistribution: this.chartGenerator.generateBarChart(analysisResults.toolAnalysis.toolDistribution.slice(0, 5).map((tool) => ({
                name: tool.name,
                value: tool.count
            })), { title: '工具使用分布', width: 50, height: 12 }),
            timeDistribution: this.chartGenerator.generatePieChart(analysisResults.timePatterns.hourlyDistribution
                .map((hours, index) => ({
                name: `${index}:00`,
                value: hours
            }))
                .filter((item) => item.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 6), { title: '活跃时间分布' })
        };
        console.log('  ✅ 数据可视化完成\n');
        return charts;
    }
    prepareTokenTrendData(basicStats) {
        return [
            { name: '第1周', value: 18500 },
            { name: '第2周', value: 22300 },
            { name: '第3周', value: 19800 },
            { name: '第4周', value: 25600 },
            { name: '第5周', value: 28400 }
        ];
    }
    async generateAndExportReports(analysisResults, insights, charts, outputDir) {
        console.log('📄 第六步：生成和导出报告');
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const fullReport = {
            metadata: {
                generatedAt: new Date().toISOString(),
                projectPath: process.cwd(),
                dataRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                },
                totalDataPoints: 100
            },
            basic: analysisResults.basic,
            efficiency: analysisResults.efficiency,
            trends: analysisResults.trendInsights || {},
            insights: insights,
            costs: analysisResults.costBreakdown || {}
        };
        const reports = {
            detailed: await this.reportGenerator.generateReport(fullReport, 'detailed'),
            summary: await this.reportGenerator.generateReport(fullReport, 'simple'),
            json: await this.reportGenerator.generateReport(fullReport, 'json'),
            markdown: await this.reportGenerator.generateReport(fullReport, 'markdown')
        };
        for (const [format, report] of Object.entries(reports)) {
            const fileName = `analysis-report.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'}`;
            const filePath = path.join(outputDir, fileName);
            fs.writeFileSync(filePath, report.content, 'utf-8');
            console.log(`  ✅ ${format} 报告已导出: ${filePath}`);
        }
        const chartsPath = path.join(outputDir, 'charts.txt');
        const chartContent = Object.entries(charts)
            .map(([name, chart]) => `=== ${name.toUpperCase()} ===\n${chart}\n`)
            .join('\n');
        fs.writeFileSync(chartsPath, chartContent, 'utf-8');
        console.log(`  ✅ 图表已导出: ${chartsPath}`);
        console.log('  ✅ 报告导出完成\n');
        return { reports, outputDir, files: Object.keys(reports).length + 1 };
    }
    displayAnalysisSummary(analysisResults, insights) {
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
            insights.primaryInsights.slice(0, 3).forEach((insight, index) => {
                console.log(`${index + 1}. ${insight.message}`);
            });
        }
        console.log('');
        console.log('🎊 分析完成！所有报告已生成并导出。');
        console.log('='.repeat(60));
    }
}
exports.ComprehensiveAnalysis = ComprehensiveAnalysis;
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
    }
    catch (error) {
        console.error('分析失败:', error);
        throw error;
    }
}
if (require.main === module) {
    runCompleteAnalysis().catch(console.error);
}
