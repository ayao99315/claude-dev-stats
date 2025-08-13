#!/usr/bin/env node

/**
 * 测试运行器脚本
 * 提供各种测试运行选项和环境配置
 */

const { execSync } = require('child_process');
const path = require('path');

// 测试配置
const TEST_CONFIGS = {
  unit: {
    pattern: 'tests/unit/**/*.test.ts',
    timeout: 30000,
    coverage: true
  },
  integration: {
    pattern: 'tests/integration/**/*.test.ts', 
    timeout: 60000,
    coverage: false
  },
  e2e: {
    pattern: 'tests/e2e/**/*.test.ts',
    timeout: 120000, 
    coverage: false
  },
  performance: {
    pattern: 'tests/performance/**/*.test.ts',
    timeout: 180000,
    coverage: false
  }
};

/**
 * 运行指定类型的测试
 */
function runTests(type, options = {}) {
  const config = TEST_CONFIGS[type];
  if (!config) {
    console.error(`❌ 未知的测试类型: ${type}`);
    console.error(`可用类型: ${Object.keys(TEST_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  console.log(`🚀 运行 ${type} 测试...`);
  
  let jestArgs = [
    '--testMatch', `"<rootDir>/${config.pattern}"`,
    '--testTimeout', config.timeout.toString()
  ];

  if (config.coverage && !options.noCoverage) {
    jestArgs.push('--coverage');
  }

  if (options.watch) {
    jestArgs.push('--watch');
  }

  if (options.verbose) {
    jestArgs.push('--verbose');
  }

  if (options.bail) {
    jestArgs.push('--bail');
  }

  const command = `npx jest ${jestArgs.join(' ')}`;
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${type} 测试完成`);
  } catch (error) {
    console.error(`❌ ${type} 测试失败`);
    process.exit(1);
  }
}

/**
 * 运行所有测试
 */
function runAllTests(options = {}) {
  const testOrder = ['unit', 'integration', 'e2e'];
  
  console.log('🎯 运行所有测试套件...');
  
  for (const testType of testOrder) {
    try {
      runTests(testType, { ...options, noCoverage: testType !== 'unit' });
    } catch (error) {
      console.error(`❌ ${testType} 测试失败，停止执行`);
      process.exit(1);
    }
  }
  
  console.log('🎉 所有测试通过！');
}

/**
 * 生成测试报告
 */
function generateReports() {
  console.log('📊 生成测试报告...');
  
  try {
    // 运行测试并生成覆盖率报告
    execSync('npx jest --coverage --coverageReporters=text --coverageReporters=html --coverageReporters=lcov', {
      stdio: 'inherit'
    });
    
    console.log('✅ 测试报告已生成到 coverage/ 目录');
  } catch (error) {
    console.error('❌ 测试报告生成失败');
    process.exit(1);
  }
}

/**
 * 清理测试环境
 */
function cleanTestEnv() {
  console.log('🧹 清理测试环境...');
  
  const { execSync } = require('child_process');
  const fs = require('fs');
  
  // 清理覆盖率文件
  try {
    if (fs.existsSync('coverage')) {
      execSync('rm -rf coverage');
    }
    
    // 清理Jest缓存
    execSync('npx jest --clearCache');
    
    console.log('✅ 测试环境清理完成');
  } catch (error) {
    console.warn('⚠️ 清理过程中出现警告:', error.message);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const options = {
    watch: args.includes('--watch'),
    verbose: args.includes('--verbose'),
    bail: args.includes('--bail'),
    noCoverage: args.includes('--no-coverage')
  };
  
  switch (command) {
    case 'unit':
    case 'integration':  
    case 'e2e':
    case 'performance':
      runTests(command, options);
      break;
      
    case 'all':
      runAllTests(options);
      break;
      
    case 'report':
      generateReports();
      break;
      
    case 'clean':
      cleanTestEnv();
      break;
      
    case '--help':
    case '-h':
      console.log(`
Claude Dev Stats 测试运行器

用法:
  node scripts/test-runner.js <command> [options]

命令:
  unit          运行单元测试
  integration   运行集成测试  
  e2e           运行端到端测试
  performance   运行性能测试
  all           运行所有测试
  report        生成测试报告
  clean         清理测试环境

选项:
  --watch       监听文件变化
  --verbose     详细输出
  --bail        首次失败时停止
  --no-coverage 不生成覆盖率报告

示例:
  node scripts/test-runner.js unit --watch
  node scripts/test-runner.js all --bail
  node scripts/test-runner.js report
      `);
      break;
      
    default:
      console.error(`❌ 未知命令: ${command}`);
      console.error('使用 --help 查看帮助信息');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  runAllTests,
  generateReports,
  cleanTestEnv
};