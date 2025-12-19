/**
 * 隐藏迷宫 - 视野系统模块
 * 管理两种视野模式：永久显示模式和即时视野模式
 */

class ViewSystem {
    /**
     * 创建视野系统实例
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        this.mode = options.mode || 'permanent'; // 'permanent' 或 'instant'
        this.viewRange = options.viewRange || 1; // 视野范围（3×3区域）
        this.visibleCells = new Set(); // 当前可见的单元格
        this.exploredCells = new Set(); // 已探索的单元格
        this.permanentCells = new Set(); // 永久显示的单元格（仅永久模式）
        
        // 视野计算缓存
        this.cache = new Map();
    }
    
    /**
     * 设置视野模式
     * @param {string} mode - 视野模式 ('permanent' 或 'instant')
     */
    setMode(mode) {
        if (mode !== 'permanent' && mode !== 'instant') {
            console.error('无效的视野模式:', mode);
            return;
        }
        
        this.mode = mode;
        this.cache.clear(); // 清除缓存
        
        console.log(`视野模式设置为: ${this.getModeName()}`);
    }
    
    /**
     * 获取模式名称（中文）
     * @returns {string} 模式名称
     */
    getModeName() {
        return this.mode === 'permanent' ? '永久显示模式' : '即时视野模式';
    }
    
    /**
     * 获取模式描述
     * @returns {string} 模式描述
     */
    getModeDescription() {
        if (this.mode === 'permanent') {
            return '已探索的区域永久显示在屏幕上，适合策略型玩家';
        } else {
            return '只显示当前视野范围内的区域，离开后不再显示，增加游戏难度和沉浸感';
        }
    }
    
    /**
     * 更新视野
     * @param {number} playerX - 玩家x坐标
     * @param {number} playerY - 玩家y坐标
     * @param {Maze} maze - 迷宫实例
     * @returns {Set} 更新后的可见单元格集合
     */
    update(playerX, playerY, maze) {
        // 计算当前视野
        const newVisibleCells = this.calculateVisibleArea(playerX, playerY, maze);
        
        // 更新可见单元格
        this.visibleCells = newVisibleCells;
        
        // 根据模式处理已探索单元格
        if (this.mode === 'permanent') {
            // 永久模式：将当前可见单元格添加到已探索集合和永久显示集合
            for (const cellKey of newVisibleCells) {
                this.exploredCells.add(cellKey);
                this.permanentCells.add(cellKey);
            }
            
            // 合并永久显示单元格到可见集合
            for (const cellKey of this.permanentCells) {
                this.visibleCells.add(cellKey);
            }
        } else {
            // 即时模式：只将当前可见单元格添加到已探索集合
            // 注意：在即时模式下，离开区域后该区域不再显示
            // 所以只记录当前可见的单元格为"已探索"
            this.exploredCells.clear(); // 清除之前的已探索记录
            for (const cellKey of newVisibleCells) {
                this.exploredCells.add(cellKey);
            }
        }
        
        return this.visibleCells;
    }
    
    /**
     * 计算可见区域
     * @param {number} playerX - 玩家x坐标
     * @param {number} playerY - 玩家y坐标
     * @param {Maze} maze - 迷宫实例
     * @returns {Set} 可见单元格集合
     */
    calculateVisibleArea(playerX, playerY, maze) {
        const cacheKey = `${playerX},${playerY},${this.viewRange}`;
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            return new Set(this.cache.get(cacheKey));
        }
        
        const visibleCells = new Set();
        const { width, height } = maze.getSize();
        
        // 计算以玩家为中心的视野区域
        for (let dy = -this.viewRange; dy <= this.viewRange; dy++) {
            for (let dx = -this.viewRange; dx <= this.viewRange; dx++) {
                const cellX = playerX + dx;
                const cellY = playerY + dy;
                
                // 检查是否在迷宫范围内
                if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
                    // 检查是否有视线
                    if (this.hasLineOfSight(playerX, playerY, cellX, cellY, maze)) {
                        const cellKey = this.getCellKey(cellX, cellY);
                        visibleCells.add(cellKey);
                    }
                }
            }
        }
        
        // 缓存结果
        this.cache.set(cacheKey, [...visibleCells]);
        
        return visibleCells;
    }
    
    /**
     * 检查两点之间是否有视线
     * @param {number} x1 - 起点x坐标
     * @param {number} y1 - 起点y坐标
     * @param {number} x2 - 终点x坐标
     * @param {number} y2 - 终点y坐标
     * @param {Maze} maze - 迷宫实例
     * @returns {boolean} 是否有视线
     */
    hasLineOfSight(x1, y1, x2, y2, maze) {
        // 简化实现：使用Bresenham算法检查直线路径
        
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = (x1 < x2) ? 1 : -1;
        const sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;
        
        let currentX = x1;
        let currentY = y1;
        
        while (true) {
            // 如果到达目标单元格，返回true
            if (currentX === x2 && currentY === y2) {
                return true;
            }
            
            // 检查从当前单元格到下一个单元格是否有墙壁
            let nextX = currentX;
            let nextY = currentY;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                nextX += sx;
            }
            if (e2 < dx) {
                err += dx;
                nextY += sy;
            }
            
            // 检查是否可以移动到下一个单元格
            const moveX = nextX - currentX;
            const moveY = nextY - currentY;
            
            if (!maze.canMove(currentX, currentY, moveX, moveY)) {
                // 有墙壁阻挡
                return false;
            }
            
            currentX = nextX;
            currentY = nextY;
        }
    }
    
    /**
     * 获取单元格的唯一键
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {string} 单元格键
     */
    getCellKey(x, y) {
        return `${x},${y}`;
    }
    
    /**
     * 从单元格键解析坐标
     * @param {string} cellKey - 单元格键
     * @returns {Object} 坐标对象
     */
    parseCellKey(cellKey) {
        const [x, y] = cellKey.split(',').map(Number);
        return { x, y };
    }
    
    /**
     * 检查单元格是否可见
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 是否可见
     */
    isCellVisible(x, y) {
        const cellKey = this.getCellKey(x, y);
        return this.visibleCells.has(cellKey);
    }
    
    /**
     * 检查单元格是否已探索
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 是否已探索
     */
    isCellExplored(x, y) {
        const cellKey = this.getCellKey(x, y);
        return this.exploredCells.has(cellKey);
    }
    
    /**
     * 获取可见单元格列表
     * @returns {Array} 可见单元格坐标数组
     */
    getVisibleCells() {
        const cells = [];
        for (const cellKey of this.visibleCells) {
            cells.push(this.parseCellKey(cellKey));
        }
        return cells;
    }
    
    /**
     * 获取已探索单元格列表
     * @returns {Array} 已探索单元格坐标数组
     */
    getExploredCells() {
        const cells = [];
        for (const cellKey of this.exploredCells) {
            cells.push(this.parseCellKey(cellKey));
        }
        return cells;
    }
    
    /**
     * 获取探索率
     * @param {number} totalCells - 总单元格数
     * @returns {number} 探索率（百分比）
     */
    getExplorationRate(totalCells) {
        if (totalCells <= 0) return 0;
        return Math.round((this.exploredCells.size / totalCells) * 100);
    }
    
    /**
     * 重置视野系统
     */
    reset() {
        this.visibleCells.clear();
        this.exploredCells.clear();
        this.permanentCells.clear();
        this.cache.clear();
        
        console.log('视野系统已重置');
    }
    
    /**
     * 添加已探索单元格（用于游戏加载）
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     */
    addExploredCell(x, y) {
        const cellKey = this.getCellKey(x, y);
        this.exploredCells.add(cellKey);
        
        if (this.mode === 'permanent') {
            this.permanentCells.add(cellKey);
        }
    }
    
    /**
     * 批量添加已探索单元格
     * @param {Array} cells - 单元格坐标数组
     */
    addExploredCells(cells) {
        for (const cell of cells) {
            this.addExploredCell(cell.x, cell.y);
        }
    }
    
    /**
     * 获取视野范围
     * @returns {number} 视野范围
     */
    getViewRange() {
        return this.viewRange;
    }
    
    /**
     * 设置视野范围
     * @param {number} range - 视野范围
     */
    setViewRange(range) {
        if (range < 1) range = 1;
        if (range > 5) range = 5; // 限制最大范围
        
        this.viewRange = range;
        this.cache.clear(); // 清除缓存
        
        console.log(`视野范围设置为: ${range} (${2*range+1}×${2*range+1}区域)`);
    }
    
    /**
     * 获取视野系统的状态
     * @returns {Object} 状态对象
     */
    getState() {
        return {
            mode: this.mode,
            viewRange: this.viewRange,
            visibleCells: this.visibleCells.size,
            exploredCells: this.exploredCells.size,
            permanentCells: this.permanentCells.size
        };
    }
    
    /**
     * 导出视野系统数据（用于保存游戏）
     * @returns {Object} 导出的数据
     */
    exportData() {
        return {
            mode: this.mode,
            viewRange: this.viewRange,
            exploredCells: [...this.exploredCells],
            permanentCells: [...this.permanentCells]
        };
    }
    
    /**
     * 导入视野系统数据（用于加载游戏）
     * @param {Object} data - 导入的数据
     */
    importData(data) {
        this.mode = data.mode || this.mode;
        this.viewRange = data.viewRange || this.viewRange;
        
        this.exploredCells.clear();
        this.permanentCells.clear();
        
        if (data.exploredCells) {
            for (const cellKey of data.exploredCells) {
                this.exploredCells.add(cellKey);
            }
        }
        
        if (data.permanentCells) {
            for (const cellKey of data.permanentCells) {
                this.permanentCells.add(cellKey);
            }
        }
        
        // 更新可见单元格
        if (this.mode === 'permanent') {
            this.visibleCells = new Set([...this.permanentCells]);
        }
        
        console.log('视野系统数据已导入');
    }
}

// 导出ViewSystem类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewSystem;
}