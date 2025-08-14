#!/usr/bin/env node

/**
 * 构建验证脚本
 * 验证构建产物的完整性和可用性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

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
 * 验证文件存在性
 */
function validateFileExists(relativePath, description) {
  const fullPath = path.join(DIST_DIR, relativePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    logger.success(`${description}: ${relativePath}`);
    return true;
  } else {
    logger.error(`${description} 缺失: ${relativePath}`);
    return false;
  }
}

/**
 * 验证文件内容
 */
function validateFileContent(relativePath, validator, description) {
  const fullPath = path.join(DIST_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    logger.error(`${description} 文件不存在: ${relativePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const isValid = validator(content);
    
    if (isValid) {
      logger.success(`${description} 内容验证通过`);
      return true;
    } else {
      logger.error(`${description} 内容验证失败`);
      return false;
    }
  } catch (error) {
    logger.error(`${description} 读取失败: ${error.message}`);
    return false;
  }
}

/**
 * 验证package.json
 */
function validatePackageJson() {
  return validateFileContent('package.json', (content) => {
    try {
      const pkg = JSON.parse(content);
      
      // 验证必需字段
      const requiredFields = ['name', 'version', 'main', 'types', 'bin'];
      for (const field of requiredFields) {
        if (!pkg[field]) {
          logger.error(`package.json 缺少必需字段: ${field}`);
          return false;
        }
      }

      // 验证文件引用
      if (!fs.existsSync(path.join(DIST_DIR, pkg.main))) {
        logger.error(`package.json main 字段引用的文件不存在: ${pkg.main}`);
        return false;
      }

      if (!fs.existsSync(path.join(DIST_DIR, pkg.types))) {
        logger.error(`package.json types 字段引用的文件不存在: ${pkg.types}`);
        return false;
      }

      // 验证bin文件
      if (pkg.bin) {
        for (const [command, binPath] of Object.entries(pkg.bin)) {
          const fullBinPath = path.join(DIST_DIR, binPath);
          if (!fs.existsSync(fullBinPath)) {
            logger.error(`package.json bin 命令 ${command} 引用的文件不存在: ${binPath}`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error(`package.json 解析失败: ${error.message}`);
      return false;
    }
  }, 'package.json');
}

/**
 * 验证CLI文件
 */
function validateCliFile() {
  return validateFileContent('cli.js', (content) => {
    // 检查shebang
    if (!content.startsWith('#!/usr/bin/env node')) {
      logger.error('CLI文件缺少shebang');
      return false;
    }

    // 检查基本语法（简单验证）
    if (!content.includes('require') && !content.includes('import')) {
      logger.error('CLI文件缺少模块导入');
      return false;
    }

    return true;
  }, 'CLI文件');
}

/**
 * 验证TypeScript声明文件
 */
function validateTypeDefinitions() {
  logger.step('验证TypeScript声明文件...');
  
  // 查找所有.d.ts文件
  const findTsFiles = (dir) => {
    let tsFiles = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        tsFiles = tsFiles.concat(findTsFiles(fullPath));
      } else if (item.endsWith('.d.ts')) {
        tsFiles.push(path.relative(DIST_DIR, fullPath));
      }
    }
    
    return tsFiles;
  };

  const tsFiles = findTsFiles(DIST_DIR);
  
  if (tsFiles.length === 0) {
    logger.error('未找到TypeScript声明文件');
    return false;
  }

  logger.info(`找到 ${tsFiles.length} 个TypeScript声明文件`);
  
  // 验证主声明文件存在
  const mainDeclaration = tsFiles.find(f => f === 'index.d.ts');
  if (!mainDeclaration) {
    logger.error('主声明文件 index.d.ts 不存在');
    return false;
  }

  logger.success('TypeScript声明文件验证通过');
  return true;
}

/**
 * 验证模块加载
 */
function validateModuleLoading() {
  logger.step('验证模块加载...');
  
  try {
    // 尝试加载主模块
    const mainPath = path.join(DIST_DIR, 'index.js');
    const mainModule = require(mainPath);
    
    if (!mainModule || typeof mainModule !== 'object') {
      logger.error('主模块加载失败或格式错误');
      return false;
    }

    // 验证主要导出是否存在
    const expectedExports = ['AnalyticsEngine', 'SimplifiedDataManager', 'ReportGenerator'];
    for (const exportName of expectedExports) {
      if (!mainModule[exportName]) {
        logger.warn(`主模块缺少导出: ${exportName}`);
      }
    }

    logger.success('模块加载验证通过');
    return true;
    
  } catch (error) {
    logger.error(`模块加载失败: ${error.message}`);
    return false;
  }
}

/**
 * 验证CLI可执行性
 */
function validateCliExecutable() {
  logger.step('验证CLI可执行性...');
  
  try {
    const cliPath = path.join(DIST_DIR, 'cli.js');
    
    // 在生产环境中，尝试执行help命令
    const result = execSync(`node "${cliPath}" --help`, { 
      encoding: 'utf8',
      timeout: 10000,
      cwd: DIST_DIR
    });
    
    if (result && result.includes('claude-dev-stats')) {
      logger.success('CLI可执行性验证通过');
      return true;
    } else {
      logger.error('CLI执行结果异常');
      return false;
    }
    
  } catch (error) {
    logger.error(`CLI可执行性验证失败: ${error.message}`);
    return false;
  }
}

/**
 * 主验证函数
 */
function validateBuild() {
  logger.info('开始验证构建产物...');
  
  // 检查构建目录是否存在
  if (!fs.existsSync(DIST_DIR)) {
    logger.error(`构建目录不存在: ${DIST_DIR}`);
    process.exit(1);
  }

  const validations = [
    // 文件存在性验证
    () => validateFileExists('index.js', '主模块文件'),
    () => validateFileExists('index.d.ts', '主声明文件'),
    () => validateFileExists('cli.js', 'CLI文件'),
    () => validateFileExists('package.json', '包配置文件'),
    
    // 文件内容验证
    () => validatePackageJson(),
    () => validateCliFile(),
    () => validateTypeDefinitions(),
    
    // 功能验证
    () => validateModuleLoading(),
    () => validateCliExecutable()
  ];

  let passed = 0;
  let total = validations.length;

  for (const validation of validations) {
    if (validation()) {
      passed++;
    }
  }

  // 输出验证结果
  logger.info(`验证完成: ${passed}/${total} 项通过`);
  
  if (passed === total) {
    logger.success('所有验证通过! 构建产物可用于发布');
    return true;
  } else {
    logger.error('验证失败! 请修复问题后重新构建');
    return false;
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  const success = validateBuild();
  process.exit(success ? 0 : 1);
}

module.exports = { validateBuild };