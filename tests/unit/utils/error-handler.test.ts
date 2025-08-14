/**
 * ErrorHandler 单元测试
 * 错误处理器的核心功能测试
 */

import { ErrorHandler, ErrorSeverity, withRetry, handleErrors, measurePerformance } from '../../../src/utils/error-handler';
import { logger } from '../../../src/utils/logger';

// Mock logger
jest.mock('../../../src/utils/logger');

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler = new ErrorHandler();
  });

  describe('构造函数', () => {
    test('应该正确初始化', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
    });
  });

  describe('handleError', () => {
    test('应该处理标准错误', () => {
      const error = new Error('Test error');
      const result = errorHandler.handleError(error, ErrorSeverity.MEDIUM);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('应该处理字符串错误', () => {
      const error = 'String error message';
      const result = errorHandler.handleError(error, ErrorSeverity.LOW);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(error);
    });

    test('应该包含上下文信息', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', data: { id: 123 } };
      
      const result = errorHandler.handleError(error, ErrorSeverity.HIGH, context);

      expect(result.context).toEqual(context);
    });
  });

  describe('logError', () => {
    test('应该记录不同级别的错误', () => {
      const error = new Error('Test error');
      
      errorHandler.logError(error, ErrorSeverity.HIGH);
      expect(logger.error).toHaveBeenCalled();
      
      errorHandler.logError(error, ErrorSeverity.MEDIUM);
      expect(logger.warn).toHaveBeenCalled();
      
      errorHandler.logError(error, ErrorSeverity.LOW);
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('shouldRetry', () => {
    test('应该根据错误类型决定是否重试', () => {
      const networkError = new Error('ECONNRESET');
      expect(errorHandler.shouldRetry(networkError)).toBe(true);
      
      const syntaxError = new SyntaxError('Invalid JSON');
      expect(errorHandler.shouldRetry(syntaxError)).toBe(false);
    });
  });

  describe('formatErrorMessage', () => {
    test('应该格式化错误消息', () => {
      const error = new Error('Test error');
      const formatted = errorHandler.formatErrorMessage(error);

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('Error');
    });

    test('应该包含堆栈信息', () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace here';
      
      const formatted = errorHandler.formatErrorMessage(error, true);
      expect(formatted).toContain('Stack trace here');
    });
  });
});

describe('Decorators', () => {
  describe('withRetry', () => {
    test('应该重试失败的函数', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await withRetry(mockFn, 3, 10);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('应该在超过重试次数后抛出错误', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(withRetry(mockFn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleErrors', () => {
    test('应该包装函数并处理错误', () => {
      const originalFn = () => {
        throw new Error('Function error');
      };

      const wrappedFn = handleErrors(originalFn);
      const result = wrappedFn();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Function error');
    });

    test('应该返回成功结果', () => {
      const originalFn = () => 'success result';

      const wrappedFn = handleErrors(originalFn);
      const result = wrappedFn();

      expect(result.success).toBe(true);
      expect(result.data).toBe('success result');
    });
  });

  describe('measurePerformance', () => {
    test('应该测量函数执行时间', async () => {
      const mockFn = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      });

      const wrappedFn = measurePerformance(mockFn, 'testOperation');
      const result = await wrappedFn();

      expect(result).toBe('result');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('testOperation completed'),
        expect.objectContaining({
          operation: 'testOperation',
          duration: expect.any(Number)
        })
      );
    });
  });
});