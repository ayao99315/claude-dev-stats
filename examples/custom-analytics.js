"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceAnalysisPlugin = exports.CodeQualityAnalysisPlugin = exports.CustomAnalyticsService = void 0;
exports.runCustomAnalysisExample = runCustomAnalysisExample;
const src_1 = require("../src");
class CodeQualityAnalysisPlugin {
    constructor() {
        this.name = 'code-quality-analyzer';
        this.version = '1.0.0';
        this.description = '基于工具使用模式分析代码质量';
    }
    async analyze(data) {
        const qualityMetrics = {
            refactoringFrequency: this.calculateRefactoringFrequency(data),
            testingHabits: this.analyzeTestingHabits(data),
            documentationPractice: this.evaluateDocumentationPractice(data),
            codeReviewPatterns: this.analyzeCodeReviewPatterns(data),
            overallQualityScore: 0,
            qualityRating: 'unknown',
            recommendations: []
        };
        qualityMetrics.overallQualityScore = this.calculateOverallQualityScore(qualityMetrics);
        qualityMetrics.qualityRating = this.determineQualityRating(qualityMetrics.overallQualityScore);
        qualityMetrics.recommendations = this.generateQualityRecommendations(qualityMetrics);
        return qualityMetrics;
    }
    calculateRefactoringFrequency(data) {
        let refactoringEvents = 0;
        let totalEditEvents = 0;
        let refactoringDuration = 0;
        data.forEach(record => {
            record.tool_usage?.forEach(tool => {
                if (tool.tool_name === 'Edit') {
                    totalEditEvents++;
                    if (tool.duration_seconds && tool.duration_seconds > 300) {
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
    calculateRefactoringIntensity(frequency, avgDuration) {
        const intensityScore = frequency * 0.7 + (avgDuration / 1800) * 0.3;
        if (intensityScore > 0.7)
            return 'high';
        if (intensityScore > 0.3)
            return 'medium';
        return 'low';
    }
    analyzeTestingHabits(data) {
        let testFileOperations = 0;
        let totalFileOperations = 0;
        let testWriteOperations = 0;
        data.forEach(record => {
            record.file_operations?.forEach(fileOp => {
                totalFileOperations++;
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
    isTestFile(filePath) {
        if (!filePath)
            return false;
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
    assessTDD(testWriteRatio, testCoverage) {
        if (testWriteRatio > 0.4 && testCoverage > 0.3)
            return 'strong';
        if (testWriteRatio > 0.2 && testCoverage > 0.15)
            return 'moderate';
        if (testWriteRatio > 0.1 || testCoverage > 0.05)
            return 'weak';
        return 'none';
    }
    calculateTestingConsistency(data) {
        const testingDays = new Set();
        data.forEach(record => {
            const hasTestingActivity = record.file_operations?.some(fileOp => this.isTestFile(fileOp.file_path));
            if (hasTestingActivity) {
                const date = new Date(record.timestamp).toDateString();
                testingDays.add(date);
            }
        });
        const totalDays = Math.max(1, Math.ceil((new Date().getTime() - new Date(data[0]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
        return testingDays.size / totalDays;
    }
    evaluateDocumentationPractice(data) {
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
    isDocumentationFile(filePath) {
        if (!filePath)
            return false;
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
    assessDocumentationQuality(docRatio, readmeAttention) {
        const qualityScore = docRatio * 0.7 + readmeAttention * 0.3;
        if (qualityScore > 0.15)
            return 'excellent';
        if (qualityScore > 0.1)
            return 'good';
        if (qualityScore > 0.05)
            return 'fair';
        return 'poor';
    }
    analyzeCodeReviewPatterns(data) {
        let reviewRelatedOperations = 0;
        let totalOperations = 0;
        let iterativeEditPatterns = 0;
        data.forEach(record => {
            totalOperations += record.file_operations?.length || 0;
            const editOperations = record.file_operations?.filter(op => op.operation_type === 'edit') || [];
            const fileEditCounts = new Map();
            editOperations.forEach(op => {
                const count = fileEditCounts.get(op.file_path) || 0;
                fileEditCounts.set(op.file_path, count + 1);
            });
            for (const [file, count] of fileEditCounts) {
                if (count >= 3) {
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
    assessReviewQuality(intensity, patterns) {
        if (intensity > 0.2 && patterns > 5)
            return 'high';
        if (intensity > 0.1 && patterns > 2)
            return 'medium';
        return 'low';
    }
    assessCollaborationLevel(patterns) {
        if (patterns > 10)
            return 'active';
        if (patterns > 3)
            return 'moderate';
        return 'minimal';
    }
    calculateOverallQualityScore(metrics) {
        const weights = {
            refactoring: 0.25,
            testing: 0.35,
            documentation: 0.25,
            codeReview: 0.15
        };
        let score = 0;
        if (metrics.refactoringFrequency) {
            const refactoringScore = this.normalizeRefactoringScore(metrics.refactoringFrequency);
            score += refactoringScore * weights.refactoring;
        }
        if (metrics.testingHabits) {
            const testingScore = this.normalizeTestingScore(metrics.testingHabits);
            score += testingScore * weights.testing;
        }
        if (metrics.documentationPractice) {
            const docScore = this.normalizeDocumentationScore(metrics.documentationPractice);
            score += docScore * weights.documentation;
        }
        if (metrics.codeReviewPatterns) {
            const reviewScore = this.normalizeReviewScore(metrics.codeReviewPatterns);
            score += reviewScore * weights.codeReview;
        }
        return Math.round(score * 100);
    }
    normalizeRefactoringScore(metrics) {
        const intensityScore = metrics.refactoringIntensity === 'high' ? 1 :
            metrics.refactoringIntensity === 'medium' ? 0.6 : 0.3;
        const frequencyScore = Math.min(1, metrics.frequency * 10);
        return (intensityScore + frequencyScore) / 2;
    }
    normalizeTestingScore(metrics) {
        const coverageScore = Math.min(1, metrics.testCoverage * 5);
        const tddScore = metrics.testDrivenDevelopment === 'strong' ? 1 :
            metrics.testDrivenDevelopment === 'moderate' ? 0.7 :
                metrics.testDrivenDevelopment === 'weak' ? 0.4 : 0;
        const consistencyScore = metrics.testingConsistency;
        return (coverageScore * 0.4 + tddScore * 0.4 + consistencyScore * 0.2);
    }
    normalizeDocumentationScore(metrics) {
        const ratioScore = Math.min(1, metrics.documentationRatio * 10);
        const qualityScore = metrics.documentationQuality === 'excellent' ? 1 :
            metrics.documentationQuality === 'good' ? 0.8 :
                metrics.documentationQuality === 'fair' ? 0.6 : 0.3;
        return (ratioScore + qualityScore) / 2;
    }
    normalizeReviewScore(metrics) {
        const intensityScore = Math.min(1, metrics.reviewIntensity * 5);
        const qualityScore = metrics.reviewQuality === 'high' ? 1 :
            metrics.reviewQuality === 'medium' ? 0.7 : 0.4;
        return (intensityScore + qualityScore) / 2;
    }
    determineQualityRating(score) {
        if (score >= 85)
            return 'excellent';
        if (score >= 70)
            return 'good';
        if (score >= 55)
            return 'average';
        if (score >= 40)
            return 'fair';
        return 'poor';
    }
    generateQualityRecommendations(metrics) {
        const recommendations = [];
        if (metrics.refactoringFrequency.refactoringIntensity === 'low') {
            recommendations.push('建议增加代码重构频率，保持代码质量');
        }
        if (metrics.testingHabits.testDrivenDevelopment === 'weak' || metrics.testingHabits.testDrivenDevelopment === 'none') {
            recommendations.push('建议采用测试驱动开发(TDD)实践，先写测试再写实现');
        }
        if (metrics.testingHabits.testCoverage < 0.2) {
            recommendations.push('测试覆盖率较低，建议为核心功能增加更多测试用例');
        }
        if (metrics.documentationPractice.documentationQuality === 'poor' ||
            metrics.documentationPractice.documentationQuality === 'fair') {
            recommendations.push('建议完善项目文档，包括README、API文档和代码注释');
        }
        if (metrics.codeReviewPatterns.reviewQuality === 'low') {
            recommendations.push('建议建立更规范的代码审查流程，提高代码质量');
        }
        return recommendations;
    }
}
exports.CodeQualityAnalysisPlugin = CodeQualityAnalysisPlugin;
class PerformanceAnalysisPlugin {
    constructor() {
        this.name = 'performance-analyzer';
        this.version = '1.0.0';
        this.description = '分析开发性能和效率模式';
    }
    async analyze(data) {
        return {
            responseTime: this.analyzeResponseTime(data),
            throughput: this.analyzeThroughput(data),
            efficiency: this.analyzeEfficiencyPatterns(data),
            bottlenecks: this.identifyBottlenecks(data),
            performanceScore: 0,
            recommendations: []
        };
    }
    analyzeResponseTime(data) {
        const sessionLengths = [];
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
    calculatePercentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }
    analyzeThroughput(data) {
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
    analyzeEfficiencyPatterns(data) {
        const batchingSessions = data.filter(record => record.token_usage.total_tokens > 2000).length;
        const interactiveSessions = data.length - batchingSessions;
        const batchingRatio = data.length > 0 ? batchingSessions / data.length : 0;
        const workHours = this.analyzeWorkHours(data);
        return {
            batchingRatio,
            batchingSessions,
            interactiveSessions,
            workHours,
            efficiency: this.calculateEfficiencyScore(batchingRatio, workHours)
        };
    }
    analyzeWorkHours(data) {
        const hourCounts = new Array(24).fill(0);
        data.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            hourCounts[hour]++;
        });
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const workingHours = hourCounts.reduce((count, sessions, hour) => sessions > 0 ? count + 1 : count, 0);
        return {
            peakHour,
            workingHours,
            distribution: hourCounts,
            pattern: this.identifyWorkPattern(hourCounts)
        };
    }
    identifyWorkPattern(hourCounts) {
        const maxSessions = Math.max(...hourCounts);
        const activeSessions = hourCounts.filter(count => count > 0).length;
        const totalSessions = hourCounts.reduce((a, b) => a + b, 0);
        const concentration = maxSessions / totalSessions;
        if (concentration > 0.4)
            return 'focused';
        if (activeSessions > 12)
            return 'distributed';
        return 'irregular';
    }
    calculateEfficiencyScore(batchingRatio, workHours) {
        const batchingScore = batchingRatio * 0.3;
        const focusScore = workHours.pattern === 'focused' ? 0.4 :
            workHours.pattern === 'distributed' ? 0.2 : 0.1;
        const utilizationScore = Math.min(0.3, workHours.workingHours / 24 * 0.3);
        return batchingScore + focusScore + utilizationScore;
    }
    identifyBottlenecks(data) {
        const bottlenecks = [];
        const longSessions = data.filter(record => record.active_time_seconds > 3600);
        if (longSessions.length > data.length * 0.1) {
            bottlenecks.push({
                type: 'long_sessions',
                description: '检测到较多长时间会话，可能存在效率问题',
                severity: 'medium',
                affected_sessions: longSessions.length,
                recommendation: '考虑将复杂任务分解为更小的子任务'
            });
        }
        const lowEfficiencySessions = data.filter(record => record.active_time_seconds > 0 &&
            record.token_usage.total_tokens / record.active_time_seconds < 1);
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
exports.PerformanceAnalysisPlugin = PerformanceAnalysisPlugin;
class CustomAnalyticsService {
    constructor() {
        this.dataManager = new src_1.SimplifiedDataManager();
        this.plugins = new Map();
        this.registerPlugin(new CodeQualityAnalysisPlugin());
        this.registerPlugin(new PerformanceAnalysisPlugin());
    }
    registerPlugin(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    unregisterPlugin(pluginName) {
        return this.plugins.delete(pluginName);
    }
    getPlugins() {
        return Array.from(this.plugins.keys());
    }
    async runPluginAnalysis(pluginName, data) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin '${pluginName}' not found`);
        }
        console.log(`🔌 运行插件分析: ${plugin.description}`);
        return await plugin.analyze(data);
    }
    async runAllPlugins(data) {
        const results = new Map();
        for (const [name, plugin] of this.plugins) {
            try {
                const result = await plugin.analyze(data);
                results.set(name, result);
                console.log(`✅ 插件 '${name}' 分析完成`);
            }
            catch (error) {
                console.error(`❌ 插件 '${name}' 分析失败:`, error);
                results.set(name, { error: error.message });
            }
        }
        return results;
    }
    async performCustomAnalysis(options = {}) {
        const { plugins = Array.from(this.plugins.keys()), includeBuiltinAnalysis = true, dateRange } = options;
        console.log('🚀 开始自定义分析流程...\n');
        try {
            const data = await this.dataManager.getUsageStats({
                dateRange,
                includeSystemData: false
            });
            console.log(`📊 获取到 ${data.length} 条数据记录\n`);
            let builtinResults = {};
            if (includeBuiltinAnalysis) {
                console.log('🔬 执行内置分析...');
                const analytics = new src_1.AnalyticsEngine(this.dataManager);
                const basic = await analytics.calculateBasicStats(data);
                const efficiency = await analytics.calculateEfficiencyMetrics(data);
                builtinResults = { basic, efficiency };
                console.log('✅ 内置分析完成\n');
            }
            console.log('🔌 执行插件分析...');
            const pluginResults = new Map();
            for (const pluginName of plugins) {
                if (this.plugins.has(pluginName)) {
                    const result = await this.runPluginAnalysis(pluginName, data);
                    pluginResults.set(pluginName, result);
                }
                else {
                    console.warn(`⚠️ 插件 '${pluginName}' 未找到`);
                }
            }
            console.log('✅ 所有插件分析完成\n');
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
        }
        catch (error) {
            console.error('❌ 自定义分析失败:', error);
            throw error;
        }
    }
    generateAnalysisSummary(builtin, plugins) {
        const summary = {
            overallScore: 0,
            keyInsights: [],
            recommendations: [],
            strengths: [],
            improvementAreas: []
        };
        const codeQuality = plugins.get('code-quality-analyzer');
        if (codeQuality) {
            summary.overallScore += codeQuality.overallQualityScore * 0.4;
            summary.keyInsights.push(`代码质量评级: ${codeQuality.qualityRating}`);
            summary.recommendations.push(...codeQuality.recommendations);
            if (codeQuality.overallQualityScore >= 80) {
                summary.strengths.push('代码质量优秀');
            }
            else if (codeQuality.overallQualityScore < 60) {
                summary.improvementAreas.push('代码质量需要提升');
            }
        }
        const performance = plugins.get('performance-analyzer');
        if (performance) {
            summary.overallScore += performance.performanceScore * 60;
            summary.keyInsights.push(`性能模式: ${performance.efficiency.workHours.pattern}`);
            if (performance.bottlenecks.overall_health === 'healthy') {
                summary.strengths.push('性能表现健康');
            }
            else {
                summary.improvementAreas.push('存在性能瓶颈');
                summary.recommendations.push(...performance.bottlenecks.bottlenecks.map(b => b.recommendation));
            }
        }
        if (builtin.efficiency) {
            summary.keyInsights.push(`生产力评分: ${builtin.efficiency.productivityScore}/10`);
            if (builtin.efficiency.productivityScore >= 8) {
                summary.strengths.push('开发效率优秀');
            }
            else if (builtin.efficiency.productivityScore < 5) {
                summary.improvementAreas.push('开发效率有待提升');
            }
        }
        return summary;
    }
}
exports.CustomAnalyticsService = CustomAnalyticsService;
async function runCustomAnalysisExample() {
    console.log('🚀 开始自定义分析示例...\n');
    const customAnalytics = new CustomAnalyticsService();
    try {
        const results = await customAnalytics.performCustomAnalysis({
            includeBuiltinAnalysis: true,
            plugins: ['code-quality-analyzer', 'performance-analyzer']
        });
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
    }
    catch (error) {
        console.error('❌ 自定义分析失败:', error);
        throw error;
    }
}
if (require.main === module) {
    runCustomAnalysisExample().catch(console.error);
}
