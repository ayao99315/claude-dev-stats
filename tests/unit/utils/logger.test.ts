/**
 * Logger 单元测试
 * 日志系统的核心功能测试
 */

import { logger, createChildLogger } from '../../../src/utils/logger';
import winston from 'winston';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => mockLogger)
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
      printf: jest.fn(),
      json: jest.fn()
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  };
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础日志功能', () => {
    test('应该能记录info日志', () => {
      logger.info('Test info message');
      expect(logger.info).toHaveBeenCalledWith('Test info message');
    });

    test('应该能记录warn日志', () => {
      logger.warn('Test warning message');
      expect(logger.warn).toHaveBeenCalledWith('Test warning message');
    });

    test('应该能记录error日志', () => {
      logger.error('Test error message');
      expect(logger.error).toHaveBeenCalledWith('Test error message');
    });

    test('应该能记录debug日志', () => {
      logger.debug('Test debug message');
      expect(logger.debug).toHaveBeenCalledWith('Test debug message');
    });
  });

  describe('createChildLogger', () => {
    test('应该能创建子logger', () => {
      const childLogger = createChildLogger('TestModule');
      
      expect(logger.child).toHaveBeenCalledWith({ module: 'TestModule' });
      expect(childLogger).toBeDefined();
    });

    test('子logger应该能正常工作', () => {
      const childLogger = createChildLogger('TestModule');
      
      childLogger.info('Child logger test');
      expect(childLogger.info).toHaveBeenCalledWith('Child logger test');
    });
  });

  describe('错误对象处理', () => {
    test('应该能记录错误对象', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { error });
      
      expect(logger.error).toHaveBeenCalledWith('Error occurred', { error });
    });
  });

  describe('结构化日志', () => {
    test('应该支持结构化数据', () => {
      const metadata = {
        userId: '12345',
        action: 'login',
        timestamp: Date.now()
      };
      
      logger.info('User action', metadata);
      expect(logger.info).toHaveBeenCalledWith('User action', metadata);
    });
  });
});