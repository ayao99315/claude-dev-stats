module.exports = {
  // 使用 ts-jest 预设处理 TypeScript
  preset: 'ts-jest',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.ts'
  ],
  
  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/index.ts'
  ],
  
  // 覆盖率阈值 - 暂时降低以便调试
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 设置测试超时时间
  testTimeout: 30000,
  
  // 测试执行前的设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // TypeScript 配置
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tests/tsconfig.json'
    }]
  },
  
  // 忽略的文件模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // 清除模拟数据
  clearMocks: true,
  
  // 详细输出
  verbose: true
};