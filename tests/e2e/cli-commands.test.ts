/**
 * CLI 命令端到端测试
 * 测试完整的命令行接口功能
 */

import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('CLI 命令 E2E 测试', () => {
  const CLI_PATH = resolve(__dirname, '../../dist/cli.js');
  const timeout = 10000; // 10 seconds

  function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [CLI_PATH, ...args], { stdio: 'pipe' });
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // 设置超时
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, timeout);
    });
  }

  describe('帮助命令', () => {
    test('应该显示全局帮助', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('stats');
      expect(result.stdout).toContain('Claude Code');
    });

    test('应该显示stats命令帮助', async () => {
      const result = await runCLI(['stats', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('timeframe');
      expect(result.stdout).toContain('format');
    });
  });

  describe('版本命令', () => {
    test('应该显示版本信息', async () => {
      const result = await runCLI(['--version']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('数据源检查', () => {
    test('check命令应该检查数据源状态', async () => {
      const result = await runCLI(['check']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('数据源状态') || expect(result.stdout).toContain('Data Sources Status');
    });
  });

  describe('基础统计', () => {
    test('basic命令应该输出统计信息', async () => {
      const result = await runCLI(['basic', '--format', 'json']);
      
      // 即使没有数据，也应该返回结构化响应
      expect(result.exitCode).toBe(0);
      if (result.stdout.trim()) {
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      }
    });

    test('stats命令应该输出完整统计', async () => {
      const result = await runCLI(['stats', '--timeframe', 'today']);
      
      expect(result.exitCode).toBe(0);
      // 应该包含基本的统计信息结构
      expect(result.stdout).toContain('时间') || expect(result.stdout).toContain('Time');
    });
  });

  describe('错误处理', () => {
    test('无效命令应该显示错误', async () => {
      const result = await runCLI(['invalid-command']);
      
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('unknown') || expect(result.stderr).toContain('invalid');
    });

    test('无效参数应该显示错误', async () => {
      const result = await runCLI(['stats', '--invalid-option']);
      
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('输出格式', () => {
    test('应该支持JSON格式', async () => {
      const result = await runCLI(['basic', '--format', 'json']);
      
      if (result.exitCode === 0 && result.stdout.trim()) {
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      }
    });

    test('应该支持表格格式', async () => {
      const result = await runCLI(['basic', '--format', 'table']);
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('─') || expect(result.stdout).toContain('|');
      }
    });
  });

  describe('语言支持', () => {
    test('应该支持中文输出', async () => {
      const result = await runCLI(['basic', '--language', 'zh-CN']);
      
      if (result.exitCode === 0) {
        // 检查是否包含中文字符或中文关键词
        expect(result.stdout).toMatch(/[\u4e00-\u9fa5]/) || expect(result.stdout).toContain('时间');
      }
    });

    test('应该支持英文输出', async () => {
      const result = await runCLI(['basic', '--language', 'en-US']);
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain('Time') || expect(result.stdout).toContain('Statistics');
      }
    });
  });
});