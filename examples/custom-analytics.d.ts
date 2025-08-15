import { BasicUsageStats, AnalyticsPlugin } from '../src/types';
declare class CodeQualityAnalysisPlugin implements AnalyticsPlugin {
    name: string;
    version: string;
    description: string;
    analyze(data: BasicUsageStats[]): Promise<CodeQualityMetrics>;
    private calculateRefactoringFrequency;
    private calculateRefactoringIntensity;
    private analyzeTestingHabits;
    private isTestFile;
    private assessTDD;
    private calculateTestingConsistency;
    private evaluateDocumentationPractice;
    private isDocumentationFile;
    private assessDocumentationQuality;
    private analyzeCodeReviewPatterns;
    private assessReviewQuality;
    private assessCollaborationLevel;
    private calculateOverallQualityScore;
    private normalizeRefactoringScore;
    private normalizeTestingScore;
    private normalizeDocumentationScore;
    private normalizeReviewScore;
    private determineQualityRating;
    private generateQualityRecommendations;
}
declare class PerformanceAnalysisPlugin implements AnalyticsPlugin {
    name: string;
    version: string;
    description: string;
    analyze(data: BasicUsageStats[]): Promise<PerformanceMetrics>;
    private analyzeResponseTime;
    private calculatePercentile;
    private analyzeThroughput;
    private analyzeEfficiencyPatterns;
    private analyzeWorkHours;
    private identifyWorkPattern;
    private calculateEfficiencyScore;
    private identifyBottlenecks;
}
declare class CustomAnalyticsService {
    private dataManager;
    private plugins;
    constructor();
    registerPlugin(plugin: AnalyticsPlugin): void;
    unregisterPlugin(pluginName: string): boolean;
    getPlugins(): string[];
    runPluginAnalysis(pluginName: string, data: BasicUsageStats[]): Promise<any>;
    runAllPlugins(data: BasicUsageStats[]): Promise<Map<string, any>>;
    performCustomAnalysis(options?: {
        plugins?: string[];
        includeBuiltinAnalysis?: boolean;
        dateRange?: [Date, Date];
    }): Promise<CustomAnalysisResult>;
    private generateAnalysisSummary;
}
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
declare function runCustomAnalysisExample(): Promise<CustomAnalysisResult>;
export { CustomAnalyticsService, CodeQualityAnalysisPlugin, PerformanceAnalysisPlugin, runCustomAnalysisExample };
//# sourceMappingURL=custom-analytics.d.ts.map