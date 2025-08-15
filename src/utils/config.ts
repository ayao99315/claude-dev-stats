/**
 * 配置管理器
 * 
 * 负责加载、验证和管理应用程序配置
 * 支持多层级配置合并（默认 -> 全局 -> 项目）
 * 提供类型安全的配置访问接口
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  AppConfig,
  ProjectConfig,
  DEFAULT_APP_CONFIG,
  CONFIG_PATHS,
  ConfigValidationResult,
  ConfigValidationError,
  Language,
  DataSourceType,
  LogLevel,
  ReportFormat
} from '../types/config';

/**
 * 配置管理器类
 */
export class ConfigManager {
  private config: AppConfig;
  private configPath: string;
  private projectConfigPath?: string;
  private isLoaded: boolean = false;

  constructor() {
    this.config = { ...DEFAULT_APP_CONFIG };
    this.configPath = this.expandPath(CONFIG_PATHS.GLOBAL);
  }

  /**
   * 加载配置文件
   * 
   * @param projectPath - 可选的项目路径
   */
  async loadConfig(projectPath?: string): Promise<AppConfig> {
    try {
      // 1. 加载全局配置
      await this.loadGlobalConfig();

      // 2. 加载项目配置（如果提供了项目路径）
      if (projectPath) {
        await this.loadProjectConfig(projectPath);
      }

      // 3. 验证配置
      const validation = this.validateConfig(this.config);
      if (!validation.valid) {
        console.warn('配置验证失败，使用默认配置');
        validation.errors.forEach(error => {
          console.warn(`配置错误 ${error.path}: ${error.message}`);
        });
      }

      this.isLoaded = true;
      return this.config;
    } catch (error) {
      console.warn('加载配置失败，使用默认配置:', error);
      this.config = { ...DEFAULT_APP_CONFIG };
      this.isLoaded = true;
      return this.config;
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AppConfig {
    if (!this.isLoaded) {
      throw new Error('配置尚未加载，请先调用 loadConfig()');
    }
    return this.config;
  }

  /**
   * 获取特定配置项
   * 
   * @param key - 配置键路径（如 'data_sources.preferred'）
   */
  get<T = unknown>(key: string): T | undefined {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  /**
   * 设置配置项
   * 
   * @param key - 配置键路径
   * @param value - 配置值
   */
  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let target: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    target[keys[keys.length - 1]] = value;
  }

  /**
   * 保存配置到文件
   */
  async saveConfig(): Promise<void> {
    try {
      // 确保配置目录存在
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      // 备份原配置文件
      if (await this.fileExists(this.configPath)) {
        await this.backupConfig();
      }

      // 写入新配置
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf8'
      );
    } catch (error) {
      throw new Error(`保存配置失败: ${error}`);
    }
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = { ...DEFAULT_APP_CONFIG };
  }

  /**
   * 获取项目配置
   * 
   * @param projectPath - 项目路径
   */
  getProjectConfig(projectPath: string): ProjectConfig | undefined {
    const projectName = path.basename(projectPath);
    return this.config.projects?.[projectName];
  }

  /**
   * 设置项目配置
   * 
   * @param projectPath - 项目路径
   * @param projectConfig - 项目配置
   */
  setProjectConfig(projectPath: string, projectConfig: ProjectConfig): void {
    const projectName = path.basename(projectPath);
    
    if (!this.config.projects) {
      this.config.projects = {};
    }
    
    this.config.projects[projectName] = projectConfig;
  }

  /**
   * 加载全局配置文件
   */
  private async loadGlobalConfig(): Promise<void> {
    try {
      // 验证配置文件路径安全性
      const safePath = this.validateConfigPath(this.configPath, 'global');
      if (!safePath) {
        console.warn('全局配置文件路径不安全，跳过加载');
        return;
      }

      if (await this.fileExists(safePath)) {
        const configContent = await fs.readFile(safePath, 'utf8');
        const globalConfig = this.parseAndValidateConfig(configContent, 'global');
        
        // 如果存在 cc-stats 配置节
        if (globalConfig && globalConfig['cc-stats']) {
          this.config = this.mergeConfigs(this.config, globalConfig['cc-stats']);
        }
      }
    } catch (error) {
      console.warn('加载全局配置失败:', error);
    }
  }

  /**
   * 加载项目配置文件
   * 
   * @param projectPath - 项目路径
   */
  private async loadProjectConfig(projectPath: string): Promise<void> {
    try {
      // 验证项目路径安全性
      const safeProjectPath = this.validateProjectPath(projectPath);
      if (!safeProjectPath) {
        console.warn('项目路径不安全，跳过项目配置加载');
        return;
      }

      this.projectConfigPath = path.join(safeProjectPath, CONFIG_PATHS.PROJECT);
      
      // 验证项目配置文件路径
      const safeConfigPath = this.validateConfigPath(this.projectConfigPath, 'project');
      if (!safeConfigPath) {
        console.warn('项目配置文件路径不安全，跳过加载');
        return;
      }
      
      if (await this.fileExists(safeConfigPath)) {
        const projectConfigContent = await fs.readFile(safeConfigPath, 'utf8');
        const projectConfig = this.parseAndValidateConfig(projectConfigContent, 'project');
        
        // 合并项目配置
        if (projectConfig) {
          this.config = this.mergeConfigs(this.config, projectConfig);
        }
      }
    } catch (error) {
      console.warn('加载项目配置失败:', error);
    }
  }

  /**
   * 深度合并配置对象
   * 
   * @param base - 基础配置
   * @param override - 覆盖配置
   */
  private mergeConfigs(base: any, override: any): any {
    const result = { ...base };

    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (
          typeof override[key] === 'object' &&
          override[key] !== null &&
          !Array.isArray(override[key]) &&
          typeof base[key] === 'object' &&
          base[key] !== null &&
          !Array.isArray(base[key])
        ) {
          result[key] = this.mergeConfigs(base[key], override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }

    return result;
  }

  /**
   * 验证配置
   * 
   * @param config - 要验证的配置
   */
  private validateConfig(config: AppConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: string[] = [];

    // 验证基本字段
    if (typeof config.enabled !== 'boolean') {
      errors.push({
        path: 'enabled',
        message: 'enabled 必须是布尔值',
        value: config.enabled,
        expected: 'boolean'
      });
    }

    if (!this.isValidLanguage(config.language)) {
      errors.push({
        path: 'language',
        message: '不支持的语言类型',
        value: config.language,
        expected: 'zh-CN | en-US'
      });
    }

    // 验证数据源配置
    if (config.data_sources) {
      // Note: preferred 属性已被简化移除，不再需要验证

      if (config.data_sources.cache_timeout_ms !== undefined && config.data_sources.cache_timeout_ms < 0) {
        errors.push({
          path: 'data_sources.cache_timeout_ms',
          message: '缓存超时时间不能为负数',
          value: config.data_sources.cache_timeout_ms
        });
      }
    }

    // 验证日志配置
    if (config.logging) {
      if (!this.isValidLogLevel(config.logging.level)) {
        errors.push({
          path: 'logging.level',
          message: '不支持的日志级别',
          value: config.logging.level,
          expected: 'error | warn | info | debug'
        });
      }

      if (config.logging.max_file_size <= 0) {
        errors.push({
          path: 'logging.max_file_size',
          message: '日志文件大小必须大于0',
          value: config.logging.max_file_size
        });
      }
    }

    // 验证报告配置
    if (config.reports) {
      if (!this.isValidReportFormat(config.reports.default_format)) {
        errors.push({
          path: 'reports.default_format',
          message: '不支持的报告格式',
          value: config.reports.default_format,
          expected: 'table | detailed | brief | insights | chart | pie | financial'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 备份当前配置文件
   */
  private async backupConfig(): Promise<void> {
    const backupDir = this.expandPath(CONFIG_PATHS.BACKUP_DIR);
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `settings-${timestamp}.json`);

    await fs.copyFile(this.configPath, backupPath);
  }

  /**
   * 扩展路径中的波浪号
   * 
   * @param filePath - 文件路径
   */
  private expandPath(filePath: string): string {
    if (filePath.startsWith('~')) {
      return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
  }

  /**
   * 检查文件是否存在
   * 
   * @param filePath - 文件路径
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证语言类型
   */
  private isValidLanguage(language: string): language is Language {
    return ['zh-CN', 'en-US'].includes(language);
  }

  /**
   * 获取数据源配置（简化版）
   */
  getDataSourceConfig(): { cost_api: boolean; opentelemetry: boolean } {
    // 如果配置未加载，先尝试加载
    if (!this.isLoaded) {
      try {
        // 同步加载配置（使用默认配置）
        this.config = { ...DEFAULT_APP_CONFIG };
        this.isLoaded = true;
      } catch (error) {
        console.warn('加载配置失败，使用默认配置:', error);
        this.config = { ...DEFAULT_APP_CONFIG };
        this.isLoaded = true;
      }
    }
    
    const config = this.config;
    return {
      cost_api: config.data_sources?.cost_api ?? true,
      opentelemetry: config.data_sources?.opentelemetry ?? false
    };
  }

  /**
   * 验证数据源类型
   */
  private isValidDataSourceType(type: string): type is DataSourceType {
    return ['otel', 'jsonl', 'cost_api', 'hooks', 'auto'].includes(type);
  }

  /**
   * 验证日志级别
   */
  private isValidLogLevel(level: string): level is LogLevel {
    return ['error', 'warn', 'info', 'debug'].includes(level);
  }

  /**
   * 验证报告格式
   */
  private isValidReportFormat(format: string): format is ReportFormat {
    return ['table', 'detailed', 'brief', 'insights', 'chart', 'pie', 'financial'].includes(format);
  }

  /**
   * 验证配置文件路径安全性
   * @param configPath 配置文件路径
   * @param type 配置类型（用于日志）
   * @returns 安全的路径或null
   */
  private validateConfigPath(configPath: string, type: string): string | null {
    try {
      // 解析为绝对路径
      const absolutePath = path.resolve(configPath);
      
      // 检查路径遍历攻击
      if (absolutePath.includes('..') || absolutePath.includes('\0')) {
        console.warn(`${type}配置文件路径包含非法字符: ${configPath}`);
        return null;
      }
      
      // 限制配置文件必须在安全目录内
      const allowedDirs = [
        path.resolve(os.homedir(), '.claude'), // Claude配置目录
        path.resolve(process.cwd()), // 当前工作目录
        path.resolve(os.homedir()) // 用户主目录
      ];
      
      const isInAllowedDir = allowedDirs.some(allowedDir => 
        absolutePath.startsWith(allowedDir)
      );
      
      if (!isInAllowedDir) {
        console.warn(`${type}配置文件路径超出允许范围: ${absolutePath}`);
        return null;
      }
      
      // 确保是JSON文件
      if (!absolutePath.endsWith('.json')) {
        console.warn(`${type}配置文件必须是JSON格式: ${absolutePath}`);
        return null;
      }
      
      return absolutePath;
    } catch (error) {
      console.warn(`${type}配置路径验证失败:`, error);
      return null;
    }
  }

  /**
   * 验证项目路径安全性
   * @param projectPath 项目路径
   * @returns 安全的路径或null
   */
  private validateProjectPath(projectPath: string): string | null {
    try {
      const absolutePath = path.resolve(projectPath);
      
      // 检查路径遍历攻击
      if (absolutePath.includes('..') || absolutePath.includes('\0')) {
        console.warn(`项目路径包含非法字符: ${projectPath}`);
        return null;
      }
      
      // 确保项目路径在合理范围内（不能是系统关键目录）
      const forbiddenPaths = [
        '/',
        '/etc',
        '/bin',
        '/usr/bin',
        '/sbin',
        '/boot',
        '/sys',
        '/proc'
      ];
      
      const isForbidden = forbiddenPaths.some(forbidden => 
        absolutePath === forbidden || absolutePath.startsWith(forbidden + '/')
      );
      
      if (isForbidden) {
        console.warn(`项目路径指向系统目录，拒绝访问: ${absolutePath}`);
        return null;
      }
      
      return absolutePath;
    } catch (error) {
      console.warn('项目路径验证失败:', error);
      return null;
    }
  }

  /**
   * 安全解析和验证配置JSON
   * @param jsonString JSON字符串
   * @param type 配置类型
   * @returns 解析后的配置对象或null
   */
  private parseAndValidateConfig(jsonString: string, type: string): any | null {
    try {
      // 检查JSON长度，防止过大配置文件
      if (jsonString.length > 100 * 1024) { // 100KB限制
        console.warn(`${type}配置文件过大，跳过加载`);
        return null;
      }
      
      // 解析JSON
      const config = JSON.parse(jsonString);
      
      // 基础验证
      if (!config || typeof config !== 'object') {
        console.warn(`${type}配置文件格式无效`);
        return null;
      }
      
      // 检查是否包含危险的配置项
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const hasDangerousKeys = this.hasDangerousKeys(config, dangerousKeys);
      if (hasDangerousKeys) {
        console.warn(`${type}配置文件包含危险的配置项，拒绝加载`);
        return null;
      }
      
      return config;
    } catch (error) {
      console.warn(`${type}配置文件解析失败:`, error);
      return null;
    }
  }

  /**
   * 递归检查配置对象是否包含危险键名
   * @param obj 配置对象
   * @param dangerousKeys 危险键名列表
   * @returns 是否包含危险键名
   */
  private hasDangerousKeys(obj: any, dangerousKeys: string[]): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return true;
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (this.hasDangerousKeys(obj[key], dangerousKeys)) {
          return true;
        }
      }
    }
    
    return false;
  }
}

/**
 * 全局配置管理器实例
 */
export const configManager = new ConfigManager();