/**
 * 文件系统相关的Mock工具
 */

import { jest } from '@jest/globals';

/**
 * Mock文件系统读取操作
 */
export function mockFsReadFile(files: Record<string, string>) {
  const fs = require('fs');
  const originalReadFile = fs.promises.readFile;

  jest.spyOn(fs.promises, 'readFile').mockImplementation((filePath: string) => {
    const content = files[filePath];
    if (content !== undefined) {
      return Promise.resolve(content);
    }
    return Promise.reject(new Error(`ENOENT: no such file or directory, open '${filePath}'`));
  });

  // 返回清理函数
  return () => {
    fs.promises.readFile.mockImplementation(originalReadFile);
  };
}

/**
 * Mock目录读取操作
 */
export function mockFsReaddir(directories: Record<string, string[]>) {
  const fs = require('fs');
  const originalReaddir = fs.promises.readdir;

  jest.spyOn(fs.promises, 'readdir').mockImplementation((dirPath: string) => {
    const files = directories[dirPath];
    if (files !== undefined) {
      return Promise.resolve(files);
    }
    return Promise.reject(new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`));
  });

  return () => {
    fs.promises.readdir.mockImplementation(originalReaddir);
  };
}

/**
 * Mock文件访问权限检查
 */
export function mockFsAccess(accessiblePaths: string[]) {
  const fs = require('fs');
  const originalAccess = fs.promises.access;

  jest.spyOn(fs.promises, 'access').mockImplementation((filePath: string) => {
    if (accessiblePaths.includes(filePath)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error(`ENOENT: no such file or directory, access '${filePath}'`));
  });

  return () => {
    fs.promises.access.mockImplementation(originalAccess);
  };
}

/**
 * Mock完整的Claude配置目录结构
 */
export function mockClaudeDirectoryStructure() {
  const homeDir = require('os').homedir();
  const claudeDir = `${homeDir}/.claude`;

  const directories = {
    [claudeDir]: ['settings.json', 'logs', 'commands', 'cc-stats'],
    [`${claudeDir}/logs`]: ['conversation-2024-01-01.jsonl', 'conversation-2024-01-02.jsonl'],
    [`${claudeDir}/commands`]: ['stats.js'],
    [`${claudeDir}/cc-stats`]: ['config.json'],
    [`${claudeDir}/metrics`]: ['otel-metrics-2024-01-01.json'],
  };

  const files = {
    [`${claudeDir}/settings.json`]: JSON.stringify({
      'cc-stats': {
        enabled: true,
        language: 'zh-CN',
        data_sources: {
          preferred: 'auto'
        }
      }
    }),
    [`${claudeDir}/logs/conversation-2024-01-01.jsonl`]: `
      {"session_id":"test1","timestamp":"2024-01-01T10:00:00Z","token_usage":{"total_tokens":100}}
      {"session_id":"test2","timestamp":"2024-01-01T11:00:00Z","token_usage":{"total_tokens":150}}
    `.trim(),
    [`${claudeDir}/logs/conversation-2024-01-02.jsonl`]: `
      {"session_id":"test3","timestamp":"2024-01-02T09:00:00Z","token_usage":{"total_tokens":200}}
    `.trim(),
  };

  const cleanupReaddir = mockFsReaddir(directories);
  const cleanupReadFile = mockFsReadFile(files);
  const cleanupAccess = mockFsAccess([
    claudeDir,
    `${claudeDir}/logs`,
    `${claudeDir}/commands`,
    `${claudeDir}/cc-stats`
  ]);

  return () => {
    cleanupReaddir();
    cleanupReadFile();
    cleanupAccess();
  };
}

/**
 * Mock环境变量
 */
export function mockEnvVars(vars: Record<string, string>) {
  const originalEnv = process.env;

  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });

  return () => {
    process.env = originalEnv;
  };
}

/**
 * 创建临时测试文件结构配置
 */
export interface TestFileStructure {
  directories: string[];
  files: Record<string, string>;
  accessiblePaths: string[];
}

/**
 * 根据测试文件结构配置Mock文件系统
 */
export function mockFileSystemStructure(structure: TestFileStructure) {
  const { directories, files, accessiblePaths } = structure;

  // 构建目录映射
  const dirMap: Record<string, string[]> = {};
  directories.forEach(dir => {
    dirMap[dir] = [];
  });

  // 填充文件到目录映射中
  Object.keys(files).forEach(filePath => {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    if (dirMap[dir]) {
      dirMap[dir].push(fileName);
    }
  });

  const cleanupReaddir = mockFsReaddir(dirMap);
  const cleanupReadFile = mockFsReadFile(files);
  const cleanupAccess = mockFsAccess(accessiblePaths);

  return () => {
    cleanupReaddir();
    cleanupReadFile();
    cleanupAccess();
  };
}