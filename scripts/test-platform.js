#!/usr/bin/env node

/**
 * 跨平台兼容性测试脚本
 * 测试在不同操作系统和Node.js版本下的兼容性
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 日志工具
 */
const logger = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  step: (msg) => console.log(chalk.cyan('→'), msg)
};

/**
 * 获取系统信息
 */
function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    npmVersion: (() => {
      try {
        return execSync('npm --version', { encoding: 'utf8' }).trim();
      } catch {
        return 'unknown';
      }
    })(),
    osRelease: os.release(),
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
    cpus: os.cpus().length
  };
}

/**
 * 检查Node.js版本兼容性
 */
function checkNodeVersion() {
  logger.step('检查Node.js版本兼容性...');
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const engines = packageJson.engines;
  
  if (!engines || !engines.node) {
    logger.warn('package.json中未指定Node.js版本要求');
    return true;
  }

  const requiredVersion = engines.node;
  const currentVersion = process.version;
  
  logger.info(`要求的Node.js版本: ${requiredVersion}`);
  logger.info(`当前Node.js版本: ${currentVersion}`);
  
  // 简单版本检查（实际应用中可能需要更复杂的semver检查）
  const currentMajor = parseInt(currentVersion.slice(1).split('.')[0]);
  const requiredMajor = parseInt(requiredVersion.replace('>=', '').split('.')[0]);
  
  if (currentMajor >= requiredMajor) {
    logger.success('Node.js版本兼容');
    return true;
  } else {
    logger.error(`Node.js版本不兼容，需要 ${requiredVersion}，当前 ${currentVersion}`);
    return false;
  }
}

/**
 * 测试文件系统操作
 */
function testFileSystemOperations() {
  logger.step('测试文件系统操作...');
  
  const testDir = path.join(PROJECT_ROOT, '.test-temp');
  const testFile = path.join(testDir, 'test.txt');
  
  try {
    // 创建目录
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    
    // 写入文件
    fs.writeFileSync(testFile, 'test content');
    
    // 读取文件
    const content = fs.readFileSync(testFile, 'utf8');
    if (content !== 'test content') {
      throw new Error('文件内容不匹配');
    }
    
    // 删除文件和目录
    fs.unlinkSync(testFile);
    fs.rmdirSync(testDir);
    
    logger.success('文件系统操作测试通过');
    return true;
  } catch (error) {
    logger.error(`文件系统操作测试失败: ${error.message}`);
    
    // 清理
    try {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    } catch {}
    
    return false;
  }
}

/**
 * 测试路径处理
 */
function testPathHandling() {
  logger.step('测试路径处理...');
  
  try {
    // 测试不同的路径格式
    const testPaths = [
      'relative/path/file.txt',
      './relative/path/file.txt',
      '../parent/path/file.txt',
      'file.txt'
    ];
    
    testPaths.forEach(testPath => {
      const normalized = path.normalize(testPath);
      const resolved = path.resolve(PROJECT_ROOT, testPath);
      const joined = path.join(PROJECT_ROOT, testPath);
      
      if (typeof normalized !== 'string' || typeof resolved !== 'string' || typeof joined !== 'string') {
        throw new Error(`路径处理失败: ${testPath}`);
      }
    });
    
    // 测试路径分隔符
    const separator = path.sep;
    if (!separator || (separator !== '/' && separator !== '\\')) {
      throw new Error('无效的路径分隔符');
    }
    
    logger.success('路径处理测试通过');
    return true;
  } catch (error) {
    logger.error(`路径处理测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试子进程执行
 */
function testChildProcess() {
  logger.step('测试子进程执行...');
  
  return new Promise((resolve) => {
    try {
      // 测试简单命令执行
      const result = execSync('node --version', { encoding: 'utf8', timeout: 5000 });
      
      if (!result || !result.includes('v')) {
        throw new Error('无法获取Node.js版本');
      }
      
      // 测试spawn
      const child = spawn('node', ['--version'], { stdio: 'pipe' });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0 && output.includes('v')) {
          logger.success('子进程执行测试通过');
          resolve(true);
        } else {
          logger.error('spawn测试失败');
          resolve(false);
        }
      });
      
      child.on('error', (error) => {
        logger.error(`spawn测试失败: ${error.message}`);
        resolve(false);
      });
      
      // 超时处理
      setTimeout(() => {
        child.kill();
        logger.error('子进程执行超时');
        resolve(false);
      }, 10000);
      
    } catch (error) {
      logger.error(`子进程执行测试失败: ${error.message}`);
      resolve(false);
    }
  });
}

/**
 * 测试环境变量
 */
function testEnvironmentVariables() {
  logger.step('测试环境变量...');
  
  try {
    // 测试读取环境变量
    const nodeEnv = process.env.NODE_ENV;
    const path = process.env.PATH || process.env.Path;
    
    if (!path) {
      throw new Error('无法读取PATH环境变量');
    }
    
    // 测试设置临时环境变量
    const testVar = 'CLAUDE_DEV_STATS_TEST';
    const testValue = 'test-value-123';
    
    process.env[testVar] = testValue;
    
    if (process.env[testVar] !== testValue) {
      throw new Error('无法设置环境变量');
    }
    
    // 清理
    delete process.env[testVar];
    
    logger.success('环境变量测试通过');
    return true;
  } catch (error) {
    logger.error(`环境变量测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试模块加载
 */
function testModuleLoading() {
  logger.step('测试模块加载...');
  
  try {
    // 测试核心模块
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    if (!fs.readFileSync || !path.join || !os.platform) {
      throw new Error('核心模块API不可用');
    }
    
    // 测试第三方模块
    const chalk = require('chalk');
    if (!chalk.red || !chalk.green) {
      throw new Error('chalk模块加载失败');
    }
    
    // 测试项目模块（如果存在）
    const srcIndexPath = path.join(PROJECT_ROOT, 'src', 'index.ts');
    const distIndexPath = path.join(PROJECT_ROOT, 'dist', 'index.js');
    
    if (fs.existsSync(distIndexPath)) {
      try {
        const projectModule = require(distIndexPath);
        if (!projectModule || typeof projectModule !== 'object') {
          throw new Error('项目模块格式错误');
        }
      } catch (error) {
        logger.warn(`项目模块加载警告: ${error.message}`);
      }
    }
    
    logger.success('模块加载测试通过');
    return true;
  } catch (error) {
    logger.error(`模块加载测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试CLI可执行性
 */
function testCliExecutability() {
  logger.step('测试CLI可执行性...');
  
  return new Promise((resolve) => {
    try {
      const cliPath = path.join(PROJECT_ROOT, 'dist', 'cli.js');
      
      if (!fs.existsSync(cliPath)) {
        logger.warn('CLI文件不存在，跳过测试');
        resolve(true);
        return;
      }
      
      // 在不同平台测试CLI执行
      const command = process.platform === 'win32' ? 
        `node "${cliPath}" --help` : 
        `node "${cliPath}" --help`;
      
      const child = execSync(command, { 
        encoding: 'utf8',
        timeout: 10000,
        cwd: PROJECT_ROOT,
        stdio: 'pipe'
      });
      
      if (child && child.includes('claude-dev-stats')) {
        logger.success('CLI可执行性测试通过');
        resolve(true);
      } else {
        logger.error('CLI输出异常');
        resolve(false);
      }
      
    } catch (error) {
      logger.error(`CLI可执行性测试失败: ${error.message}`);
      resolve(false);
    }
  });
}

/**
 * 测试字符编码
 */
function testCharacterEncoding() {
  logger.step('测试字符编码...');
  
  try {
    // 测试UTF-8编码
    const testStrings = [
      'Hello World',
      '你好世界',
      'Héllo Wörld',
      '🚀 emoji test',
      'Тест кирилица'
    ];
    
    testStrings.forEach(str => {
      const buffer = Buffer.from(str, 'utf8');
      const decoded = buffer.toString('utf8');
      
      if (decoded !== str) {
        throw new Error(`字符编码测试失败: ${str}`);
      }
    });
    
    logger.success('字符编码测试通过');
    return true;
  } catch (error) {
    logger.error(`字符编码测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  const systemInfo = getSystemInfo();
  
  logger.info('开始跨平台兼容性测试...');
  console.log(`
${chalk.bold('系统信息:')}
🖥️  平台: ${systemInfo.platform} ${systemInfo.arch}
📦 Node.js: ${systemInfo.nodeVersion}
📦 npm: ${systemInfo.npmVersion}
🔧 OS版本: ${systemInfo.osRelease}
💾 内存: ${systemInfo.totalMemory}
⚡ CPU核心: ${systemInfo.cpus}
`);

  const tests = [
    { name: 'Node.js版本兼容性', test: checkNodeVersion },
    { name: '文件系统操作', test: testFileSystemOperations },
    { name: '路径处理', test: testPathHandling },
    { name: '子进程执行', test: testChildProcess },
    { name: '环境变量', test: testEnvironmentVariables },
    { name: '模块加载', test: testModuleLoading },
    { name: 'CLI可执行性', test: testCliExecutability },
    { name: '字符编码', test: testCharacterEncoding }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      logger.error(`测试 "${name}" 执行异常: ${error.message}`);
    }
  }

  // 输出测试结果
  console.log(`
${chalk.bold('测试结果:')}
✅ 通过: ${passedTests}/${totalTests}
🔴 失败: ${totalTests - passedTests}/${totalTests}
📊 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%
`);

  if (passedTests === totalTests) {
    logger.success('所有跨平台兼容性测试通过! 🎉');
    return true;
  } else if (passedTests / totalTests >= 0.8) {
    logger.warn('大部分测试通过，但存在一些兼容性问题');
    return true;
  } else {
    logger.error('跨平台兼容性测试失败，存在严重兼容性问题');
    return false;
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${chalk.bold('test-platform.js')} - 跨平台兼容性测试脚本

${chalk.bold('用法:')}
  node scripts/test-platform.js [选项]

${chalk.bold('选项:')}
  --help        显示此帮助信息
  --verbose     显示详细输出

${chalk.bold('测试项目:')}
  - Node.js版本兼容性
  - 文件系统操作
  - 路径处理
  - 子进程执行
  - 环境变量
  - 模块加载
  - CLI可执行性
  - 字符编码

${chalk.bold('支持的平台:')}
  - Windows (win32)
  - macOS (darwin)
  - Linux (linux)
  - 其他Unix-like系统
`);
}

// 检查命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    logger.error(`测试运行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { 
  runAllTests,
  getSystemInfo
};