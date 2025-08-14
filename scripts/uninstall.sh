#!/bin/bash

# Claude Code 智能开发统计与分析工具 - 卸载脚本
# 支持 macOS, Linux, Windows (WSL)

set -e

# 脚本配置
PACKAGE_NAME="claude-dev-stats"
BINARY_NAME="cc-stats"
INSTALL_DIR="${HOME}/.claude"
CONFIG_FILE="${INSTALL_DIR}/settings.json"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 图标定义
SUCCESS_ICON="✅"
ERROR_ICON="❌"
WARNING_ICON="⚠️"
INFO_ICON="ℹ️"
REMOVE_ICON="🗑️"
BACKUP_ICON="💾"
CLEAN_ICON="🧹"

# 日志函数
log_success() {
    echo -e "${GREEN}${SUCCESS_ICON} $1${NC}"
}

log_error() {
    echo -e "${RED}${ERROR_ICON} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${WARNING_ICON} $1${NC}"
}

log_info() {
    echo -e "${BLUE}${INFO_ICON} $1${NC}"
}

log_remove() {
    echo -e "${RED}${REMOVE_ICON} $1${NC}"
}

log_backup() {
    echo -e "${BLUE}${BACKUP_ICON} $1${NC}"
}

log_clean() {
    echo -e "${YELLOW}${CLEAN_ICON} $1${NC}"
}

# 显示卸载警告
show_uninstall_warning() {
    echo "🚨 Claude Code 智能开发统计与分析工具 - 卸载程序"
    echo "=================================================="
    echo
    echo -e "${YELLOW}警告：此操作将执行以下删除操作：${NC}"
    echo "  • 卸载全局 npm 包 ($PACKAGE_NAME)"
    echo "  • 删除命令行工具 ($BINARY_NAME)"
    echo "  • 清理配置和数据文件"
    echo "  • 移除缓存和日志文件"
    echo
    echo -e "${BLUE}可选操作（会询问您的选择）：${NC}"
    echo "  • 备份配置文件和数据"
    echo "  • 完全删除安装目录"
    echo "  • 清理环境变量配置"
    echo
}

# 检查安装状态
check_installation_status() {
    log_info "检查安装状态..."
    
    # 检查 npm 包是否已安装
    if npm list -g "$PACKAGE_NAME" &> /dev/null; then
        PACKAGE_INSTALLED=true
        log_info "检测到已安装的 npm 包"
    else
        PACKAGE_INSTALLED=false
        log_warning "npm 包未安装"
    fi
    
    # 检查命令是否可用
    if command -v "$BINARY_NAME" &> /dev/null; then
        COMMAND_AVAILABLE=true
        log_info "检测到可用的命令"
    else
        COMMAND_AVAILABLE=false
        log_warning "命令不可用"
    fi
    
    # 检查配置目录是否存在
    if [ -d "$INSTALL_DIR" ]; then
        CONFIG_EXISTS=true
        log_info "检测到配置目录"
    else
        CONFIG_EXISTS=false
        log_warning "配置目录不存在"
    fi
    
    # 如果什么都没安装，退出
    if [ "$PACKAGE_INSTALLED" = false ] && [ "$COMMAND_AVAILABLE" = false ] && [ "$CONFIG_EXISTS" = false ]; then
        log_success "系统中未检测到安装内容，无需卸载"
        exit 0
    fi
}

# 备份用户数据
backup_user_data() {
    if [ "$CONFIG_EXISTS" = false ]; then
        return
    fi
    
    echo
    read -p "是否备份配置文件和用户数据? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log_info "跳过数据备份"
        return
    fi
    
    # 创建备份目录
    BACKUP_DIR="${HOME}/claude-dev-stats-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份配置文件
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$BACKUP_DIR/"
        log_backup "配置文件已备份: $(basename $CONFIG_FILE)"
    fi
    
    # 备份项目数据
    if [ -d "$INSTALL_DIR/data/projects" ]; then
        cp -r "$INSTALL_DIR/data/projects" "$BACKUP_DIR/"
        log_backup "项目数据已备份"
    fi
    
    # 备份重要日志
    if [ -d "$INSTALL_DIR/logs" ]; then
        mkdir -p "$BACKUP_DIR/logs"
        find "$INSTALL_DIR/logs" -name "*.log" -mtime -30 -exec cp {} "$BACKUP_DIR/logs/" \;
        log_backup "近期日志已备份"
    fi
    
    log_success "数据备份完成: $BACKUP_DIR"
    BACKUP_CREATED=true
}

# 卸载 npm 包
uninstall_npm_package() {
    if [ "$PACKAGE_INSTALLED" = true ]; then
        log_remove "卸载 npm 包..."
        
        if npm uninstall -g "$PACKAGE_NAME"; then
            log_success "npm 包卸载成功"
        else
            log_error "npm 包卸载失败"
            return 1
        fi
    else
        log_info "npm 包未安装，跳过"
    fi
}

# 清理配置文件
clean_configuration() {
    if [ "$CONFIG_EXISTS" = false ]; then
        return
    fi
    
    echo
    read -p "是否完全删除配置目录 $INSTALL_DIR? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "保留配置目录"
        
        # 只清理缓存和临时文件
        if [ -d "$INSTALL_DIR/cache" ]; then
            rm -rf "$INSTALL_DIR/cache"
            log_clean "清理缓存目录"
        fi
        
        if [ -d "$INSTALL_DIR/logs" ]; then
            find "$INSTALL_DIR/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
            log_clean "清理旧日志文件"
        fi
        
        return
    fi
    
    # 删除整个配置目录
    if rm -rf "$INSTALL_DIR"; then
        log_remove "配置目录已删除"
    else
        log_error "配置目录删除失败"
        return 1
    fi
}

# 清理环境变量
clean_environment_variables() {
    echo
    read -p "是否清理环境变量配置? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "保留环境变量配置"
        return
    fi
    
    # 检测 shell 类型
    SHELL_TYPE=$(basename "$SHELL")
    
    case "$SHELL_TYPE" in
        bash)
            PROFILE_FILE="$HOME/.bashrc"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                PROFILE_FILE="$HOME/.bash_profile"
            fi
            ;;
        zsh)
            PROFILE_FILE="$HOME/.zshrc"
            ;;
        fish)
            PROFILE_FILE="$HOME/.config/fish/config.fish"
            ;;
        *)
            log_warning "未识别的 Shell 类型: $SHELL_TYPE"
            log_info "请手动检查环境变量配置"
            return
            ;;
    esac
    
    if [ ! -f "$PROFILE_FILE" ]; then
        log_info "配置文件不存在: $PROFILE_FILE"
        return
    fi
    
    # 创建备份
    cp "$PROFILE_FILE" "$PROFILE_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 移除相关的环境变量配置
    if grep -q "$PACKAGE_NAME\|cc-stats" "$PROFILE_FILE" 2>/dev/null; then
        # 创建临时文件，移除相关行
        grep -v "$PACKAGE_NAME\|cc-stats" "$PROFILE_FILE" > "$PROFILE_FILE.tmp" && mv "$PROFILE_FILE.tmp" "$PROFILE_FILE"
        log_clean "已清理 $PROFILE_FILE 中的相关配置"
        log_info "配置文件已备份为 ${PROFILE_FILE}.backup.*"
    else
        log_info "$PROFILE_FILE 中未找到相关配置"
    fi
}

# 验证卸载结果
verify_uninstallation() {
    log_info "验证卸载结果..."
    
    local all_clean=true
    
    # 检查 npm 包
    if npm list -g "$PACKAGE_NAME" &> /dev/null; then
        log_error "npm 包仍然存在"
        all_clean=false
    else
        log_success "npm 包已完全移除"
    fi
    
    # 检查命令可用性
    if command -v "$BINARY_NAME" &> /dev/null; then
        log_error "命令仍然可用"
        all_clean=false
    else
        log_success "命令已完全移除"
    fi
    
    # 检查配置目录
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "配置目录仍然存在 (用户选择保留)"
    else
        log_success "配置目录已移除"
    fi
    
    return $([ "$all_clean" = true ])
}

# 显示卸载完成信息
show_completion_info() {
    echo
    echo "🎯 卸载完成！"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    if [ "${BACKUP_CREATED:-false}" = true ]; then
        echo "💾 您的数据已备份到："
        echo "   $BACKUP_DIR"
        echo
    fi
    
    echo "🔄 如需重新安装："
    echo "   curl -fsSL https://raw.githubusercontent.com/your-username/claude-dev-stats/main/scripts/install.sh | bash"
    echo "   # 或"
    echo "   npm install -g $PACKAGE_NAME"
    echo
    echo "📚 获取帮助："
    echo "   GitHub: https://github.com/your-username/claude-dev-stats"
    echo "   Issues: https://github.com/your-username/claude-dev-stats/issues"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "感谢您使用 Claude Code 智能开发统计与分析工具！"
}

# 错误处理
cleanup_on_error() {
    log_error "卸载过程中发生错误"
    
    if [ "${BACKUP_CREATED:-false}" = true ]; then
        log_info "您的备份数据仍然安全: $BACKUP_DIR"
    fi
    
    log_error "请手动检查卸载状态或联系技术支持"
    exit 1
}

# 主函数
main() {
    # 设置错误处理
    trap cleanup_on_error ERR
    
    # 解析命令行参数
    FORCE_UNINSTALL=false
    KEEP_DATA=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_UNINSTALL=true
                shift
                ;;
            --keep-data)
                KEEP_DATA=true
                shift
                ;;
            --help)
                echo "使用方法: $0 [选项]"
                echo
                echo "选项:"
                echo "  --force      强制卸载，不提示确认"
                echo "  --keep-data  保留用户数据和配置"
                echo "  --help       显示帮助信息"
                echo
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                echo "使用 $0 --help 查看帮助信息"
                exit 1
                ;;
        esac
    done
    
    # 显示警告信息
    show_uninstall_warning
    
    # 确认卸载
    if [ "$FORCE_UNINSTALL" = false ]; then
        read -p "确定要继续卸载吗? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "取消卸载"
            exit 0
        fi
    fi
    
    # 执行卸载步骤
    check_installation_status
    
    if [ "$KEEP_DATA" = false ]; then
        backup_user_data
    fi
    
    uninstall_npm_package
    
    if [ "$KEEP_DATA" = false ]; then
        clean_configuration
        clean_environment_variables
    fi
    
    # 验证卸载结果
    if verify_uninstallation; then
        show_completion_info
        log_success "卸载成功完成！"
    else
        log_warning "卸载可能不完整，请检查系统状态"
        exit 1
    fi
}

# 执行主函数
main "$@"