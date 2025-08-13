/**
 * Prettier 代码格式化配置
 * 
 * 统一代码风格，提升代码可读性
 * 配合 ESLint 使用，处理代码格式化
 */

module.exports = {
  // 基本配置
  semi: true,                    // 分号
  singleQuote: true,            // 单引号
  tabWidth: 2,                  // 缩进宽度
  useTabs: false,               // 使用空格而不是制表符
  
  // 换行配置
  printWidth: 100,              // 行宽限制
  endOfLine: 'lf',             // 行尾序列
  
  // 对象和数组
  trailingComma: 'none',       // 尾随逗号：不使用
  bracketSpacing: true,        // 大括号内空格
  bracketSameLine: false,      // 大括号换行
  
  // 箭头函数参数括号
  arrowParens: 'avoid',        // 单参数时省略括号
  
  // HTML 相关（如果有的话）
  htmlWhitespaceSensitivity: 'css',
  
  // 引号处理
  quoteProps: 'as-needed',     // 仅在需要时为对象属性加引号
  
  // JSDoc 格式化
  // 保持 JSDoc 注释的格式
  overrides: [
    {
      files: '*.ts',
      options: {
        parser: 'typescript'
      }
    },
    {
      files: '*.js',
      options: {
        parser: 'babel'
      }
    },
    {
      files: '*.json',
      options: {
        parser: 'json',
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'preserve'
      }
    }
  ]
};