/**
 * Jest 测试设置文件 - 适配新设计
 * 在所有测试运行前执行的初始化配置
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 模拟控制台输出以避免测试中的噪音
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 在每个测试后清理
afterEach(() => {
  jest.clearAllMocks();
});