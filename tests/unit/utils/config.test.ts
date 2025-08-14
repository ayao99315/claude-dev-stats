/**
 * ConfigManager 单元测试
 * 配置管理器的核心功能测试
 */

import { ConfigManager } from '../../../src/utils/config';
import { Config } from '../../../src/types/config';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');
jest.mock('os');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockFS = require('fs');
  const mockPath = require('path');
  const mockOS = require('os');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock default paths
    mockOS.homedir.mockReturnValue('/Users/test');
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.resolve.mockImplementation((...args) => args.join('/'));
    
    configManager = new ConfigManager();
  });

  describe('构造函数', () => {
    test('应该正确初始化', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
    });
  });

  describe('loadConfig', () => {
    test('应该加载默认配置当文件不存在时', () => {
      mockFS.existsSync.mockReturnValue(false);
      
      const config = configManager.loadConfig();
      
      expect(config).toBeDefined();
      expect(config.data_sources).toBeDefined();
      expect(config.language).toBe('zh-CN');
    });

    test('应该加载文件中的配置', () => {
      const mockConfig: Config = {
        data_sources: {
          cost_api: true,
          opentelemetry: false
        },
        analysis: {
          project_level: true,
          trend_analysis: false
        },
        privacy_level: 'medium',
        cache: {
          enabled: true,
          ttl_minutes: 10
        },
        language: 'en-US'
      };

      mockFS.existsSync.mockReturnValue(true);
      mockFS.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const config = configManager.loadConfig();
      
      expect(config.language).toBe('en-US');
      expect(config.data_sources.cost_api).toBe(true);
    });

    test('应该处理无效的配置文件', () => {
      mockFS.existsSync.mockReturnValue(true);
      mockFS.readFileSync.mockReturnValue('invalid json');
      
      const config = configManager.loadConfig();
      
      // 应该返回默认配置
      expect(config.language).toBe('zh-CN');
    });
  });

  describe('saveConfig', () => {
    test('应该保存配置到文件', () => {
      const config: Config = {
        data_sources: {
          cost_api: true,
          opentelemetry: true
        },
        analysis: {
          project_level: true,
          trend_analysis: true
        },
        privacy_level: 'high',
        cache: {
          enabled: true,
          ttl_minutes: 5
        },
        language: 'zh-CN'
      };

      mockFS.mkdirSync = jest.fn();
      mockFS.writeFileSync = jest.fn();
      
      configManager.saveConfig(config);
      
      expect(mockFS.writeFileSync).toHaveBeenCalled();
    });

    test('应该处理保存错误', () => {
      const config: Config = {
        data_sources: {
          cost_api: true,
          opentelemetry: false
        },
        analysis: {
          project_level: true,
          trend_analysis: true
        },
        privacy_level: 'high',
        cache: {
          enabled: true,
          ttl_minutes: 5
        },
        language: 'zh-CN'
      };

      mockFS.writeFileSync = jest.fn(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => configManager.saveConfig(config)).not.toThrow();
    });
  });

  describe('validateConfig', () => {
    test('应该验证有效配置', () => {
      const validConfig: Config = {
        data_sources: {
          cost_api: true,
          opentelemetry: true
        },
        analysis: {
          project_level: true,
          trend_analysis: true
        },
        privacy_level: 'high',
        cache: {
          enabled: true,
          ttl_minutes: 5
        },
        language: 'zh-CN'
      };

      const isValid = (configManager as any).validateConfig(validConfig);
      expect(isValid).toBe(true);
    });

    test('应该拒绝无效配置', () => {
      const invalidConfig = {
        data_sources: {},
        // 缺少必需字段
      };

      const isValid = (configManager as any).validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    test('应该返回默认配置', () => {
      const defaultConfig = (configManager as any).getDefaultConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.language).toBe('zh-CN');
      expect(defaultConfig.data_sources.cost_api).toBe(true);
    });
  });

  describe('updateConfig', () => {
    test('应该更新部分配置', () => {
      const updates = {
        language: 'en-US' as const,
        privacy_level: 'low' as const
      };

      mockFS.existsSync.mockReturnValue(false);
      mockFS.mkdirSync = jest.fn();
      mockFS.writeFileSync = jest.fn();
      
      configManager.updateConfig(updates);
      
      expect(mockFS.writeFileSync).toHaveBeenCalled();
    });
  });
});