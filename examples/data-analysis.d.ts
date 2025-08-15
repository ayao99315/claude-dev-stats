import { BasicUsageStats } from '../src/types';
declare class ComprehensiveAnalysis {
    private dataManager;
    private analytics;
    private reportGenerator;
    private chartGenerator;
    constructor();
    performCompleteAnalysis(options?: {
        projectPath?: string;
        dateRange?: [Date, Date];
        analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
        outputDir?: string;
    }): Promise<{
        data: BasicUsageStats[];
        analysis: {
            basic: any;
            efficiency: any;
            toolAnalysis: {
                toolDistribution: {
                    count: number;
                    totalTime: number;
                    avgTime: number;
                    efficiency: number;
                    name: string;
                }[];
                mostUsedTool: string;
                mostEfficientTool: string;
            };
            timePatterns: {
                hourlyDistribution: any[];
                weeklyDistribution: any[];
                peakProductivityHour: number;
                peakProductivityDay: string;
                workingHours: number[];
                workPattern: string;
            };
        };
        insights: any;
        charts: {
            tokenTrend: any;
            toolDistribution: any;
            timeDistribution: any;
        };
        reports: {
            reports: {
                detailed: string;
                summary: string;
                json: string;
                markdown: string;
            };
            outputDir: string;
            files: number;
        };
    }>;
    private collectAndValidateData;
    private validateDataQuality;
    private performMultiDimensionalAnalysis;
    private analyzeToolUsagePatterns;
    private analyzeTimePatterns;
    private identifyWorkingHours;
    private identifyWorkPattern;
    private analyzeCostBreakdown;
    private calculateCostTrend;
    private analyzeModelUsage;
    private calculateProductivityIndex;
    private calculateConsistencyBonus;
    private calculateVariance;
    private getProductivityRating;
    private generateProductivityRecommendations;
    private calculatePerformanceBenchmarks;
    private identifyStrongPoints;
    private identifyImprovementAreas;
    private analyzeTrendsAndAnomalies;
    private generateIntelligentInsights;
    private generateDataVisualizations;
    private prepareTokenTrendData;
    private generateAndExportReports;
    private displayAnalysisSummary;
}
declare function runCompleteAnalysis(): Promise<{
    data: BasicUsageStats[];
    analysis: {
        basic: any;
        efficiency: any;
        toolAnalysis: {
            toolDistribution: {
                count: number;
                totalTime: number;
                avgTime: number;
                efficiency: number;
                name: string;
            }[];
            mostUsedTool: string;
            mostEfficientTool: string;
        };
        timePatterns: {
            hourlyDistribution: any[];
            weeklyDistribution: any[];
            peakProductivityHour: number;
            peakProductivityDay: string;
            workingHours: number[];
            workPattern: string;
        };
    };
    insights: any;
    charts: {
        tokenTrend: any;
        toolDistribution: any;
        timeDistribution: any;
    };
    reports: {
        reports: {
            detailed: string;
            summary: string;
            json: string;
            markdown: string;
        };
        outputDir: string;
        files: number;
    };
}>;
export { ComprehensiveAnalysis, runCompleteAnalysis };
//# sourceMappingURL=data-analysis.d.ts.map