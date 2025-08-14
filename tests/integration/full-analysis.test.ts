/**
 * 完整分析流程集成测试
 * 测试从数据获取到报告生成的完整流程
 */

import { AnalyticsEngine } from '../../src/analytics';
import { SimplifiedDataManager } from '../../src/data-sources/simplified-manager';
import { ReportGenerator } from '../../src/reports/generator';
import { ConfigManager } from '../../src/utils/config';

// Mock 依赖
jest.mock('../../src/utils/logger');
jest.mock('child_process');

describe('完整分析流程集成测试', () => {
  let analyticsEngine: AnalyticsEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsEngine = new AnalyticsEngine();
  });

  test('应该能完成完整的分析流程', async () => {
    // 模拟成功的数据获取
    const mockExec = require('child_process').exec;
    mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
      callback(null, {
        stdout: JSON.stringify({
          input_tokens: 1000,
          output_tokens: 500,
          total_tokens: 1500,
          total_cost: 0.075,
          session_duration: 120,
          messages: 15
        }),
        stderr: ''
      });
    });

    // 执行完整分析
    const result = await analyticsEngine.performFullAnalysis('/test/project');

    expect(result).toBeDefined();
    expect(result.basic_stats).toBeDefined();
    expect(result.efficiency).toBeDefined();
    expect(result.trends).toBeDefined();
    expect(result.insights).toBeDefined();
    expect(result.generated_at).toBeDefined();
  });

  test('应该处理数据获取失败的情况', async () => {
    // 模拟数据获取失败
    const mockExec = require('child_process').exec;
    mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
      callback(new Error('API Error'), null);
    });

    await expect(analyticsEngine.performFullAnalysis('/test/project'))
      .rejects.toThrow();
  });

  test('应该能生成不同类型的报告', async () => {
    // 模拟成功的数据获取
    const mockExec = require('child_process').exec;
    mockExec.mockImplementation((cmd: string, options: any, callback: Function) => {
      callback(null, {
        stdout: JSON.stringify({
          total_tokens: 1000,
          total_cost: 0.05,
          session_duration: 60,
          messages: 10
        }),
        stderr: ''
      });
    });

    const result = await analyticsEngine.performFullAnalysis('/test/project');
    const reportGenerator = new ReportGenerator();

    // 测试不同类型的报告
    const basicReport = reportGenerator.generateReport('basic', result.basic_stats, result, 'table', 'zh-CN');
    expect(basicReport.type).toBe('basic');

    const efficiencyReport = reportGenerator.generateReport('efficiency', result.basic_stats, result, 'detailed', 'zh-CN');
    expect(efficiencyReport.type).toBe('efficiency');

    const fullReport = reportGenerator.generateReport('full', result.basic_stats, result, 'detailed', 'zh-CN');
    expect(fullReport.type).toBe('full');
  });
});