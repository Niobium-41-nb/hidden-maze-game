/**
 * 隐藏迷宫 - 游戏核心逻辑模块
 * 管理游戏状态、玩家移动、游戏规则等
 */

class Game {
    /**
     * 创建游戏实例
     * @param {Object} options - 游戏配置选项
     */
    constructor(options = {}) {
        // 默认配置
        this.config = {
            mazeSize: options.mazeSize || 15,
            viewMode: options.viewMode || 'permanent', // 'permanent' 或 'instant'
            cellSize: options.cellSize || 40,
            showSolution: options.showSolution || false
        };
        
        // 游戏状态
        this.state = {
            isRunning: false,
            isPaused: false,
            isGameOver: false,
            isVictory: false,
            moves: 0,
            startTime: null,
            endTime: null
        };
        
        // 游戏组件
        this.maze = null;
        this.player = null;
        this.viewSystem = null;
        
        // 渲染上下文
        this.canvas = null;
        this.ctx = null;
        
        // 游戏数据
        this.exploredCells = new Set(); // 已探索的单元格
        this.visitedCells = new Set();  // 玩家访问过的单元格
        
        // 事件监听器
        this.eventListeners = {
            onGameStart: [],
            onGameOver: [],
            onVictory: [],
            onMove: [],
            onCellExplored: []
        };
        
        // 初始化游戏
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 创建迷宫
        this.maze = new Maze(this.config.mazeSize, this.config.mazeSize);
        this.maze.generate();
        
        // 获取起点和终点
        const start = this.maze.getStart();
        const end = this.maze.getEnd();
        
        // 创建玩家
        this.player = {
            x: start.x,
            y: start.y,
            prevX: start.x,
            prevY: start.y
        };
        
        // 初始化已探索和已访问的单元格
        this.exploredCells.clear();
        this.visitedCells.clear();
        
        // 将起点标记为已探索和已访问
        const startKey = this.getCellKey(start.x, start.y);
        this.exploredCells.add(startKey);
        this.visitedCells.add(startKey);
        
        // 创建视野系统
        this.viewSystem = new ViewSystem({
            mode: this.config.viewMode,
            viewRange: 1 // 3×3视野范围
        });
        
        // 更新视野
        this.updateVisibility();
        
        // 重置游戏状态
        this.state = {
            isRunning: false,
            isPaused: false,
            isGameOver: false,
            isVictory: false,
            moves: 0,
            startTime: null,
            endTime: null
        };
    }
    
    /**
     * 开始游戏
     */
    start() {
        if (this.state.isRunning) return;
        
        this.state.isRunning = true;
        this.state.startTime = Date.now();
        this.state.isGameOver = false;
        this.state.isVictory = false;
        
        // 触发游戏开始事件
        this.triggerEvent('onGameStart', {
            mazeSize: this.config.mazeSize,
            viewMode: this.config.viewMode,
            startPosition: { ...this.player },
            endPosition: this.maze.getEnd()
        });
        
        console.log('游戏开始！');
    }
    
    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (!this.state.isRunning || this.state.isGameOver) return;
        
        this.state.isPaused = !this.state.isPaused;
        
        if (this.state.isPaused) {
            console.log('游戏已暂停');
        } else {
            console.log('游戏继续');
        }
    }
    
    /**
     * 重新开始游戏
     */
    restart() {
        this.init();
        this.start();
        console.log('游戏重新开始');
    }
    
    /**
     * 移动玩家
     * @param {number} dx - x方向移动量 (-1, 0, 1)
     * @param {number} dy - y方向移动量 (-1, 0, 1)
     * @returns {boolean} 移动是否成功
     */
    movePlayer(dx, dy) {
        // 检查游戏状态
        if (!this.state.isRunning || this.state.isPaused || this.state.isGameOver) {
            return false;
        }
        
        // 检查移动是否有效（只能移动一个单元格）
        if ((dx === 0 && dy === 0) || Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            return false;
        }
        
        // 计算新位置
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // 检查是否在迷宫范围内
        if (newX < 0 || newX >= this.config.mazeSize || 
            newY < 0 || newY >= this.config.mazeSize) {
            return false;
        }
        
        // 检查是否可以移动（没有墙壁阻挡）
        if (!this.maze.canMove(this.player.x, this.player.y, dx, dy)) {
            return false;
        }
        
        // 保存旧位置
        this.player.prevX = this.player.x;
        this.player.prevY = this.player.y;
        
        // 更新玩家位置
        this.player.x = newX;
        this.player.y = newY;
        
        // 更新移动计数
        this.state.moves++;
        
        // 标记单元格为已访问
        const cellKey = this.getCellKey(newX, newY);
        this.visitedCells.add(cellKey);
        
        // 更新视野
        this.updateVisibility();
        
        // 触发移动事件
        this.triggerEvent('onMove', {
            from: { x: this.player.prevX, y: this.player.prevY },
            to: { x: newX, y: newY },
            moves: this.state.moves
        });
        
        // 检查是否到达终点
        const end = this.maze.getEnd();
        if (newX === end.x && newY === end.y) {
            this.victory();
            return true;
        }
        
        return true;
    }
    
    /**
     * 更新视野可见性
     */
    updateVisibility() {
        const { x, y } = this.player;
        
        // 使用ViewSystem更新视野
        this.viewSystem.update(x, y, this.maze);
        
        // 获取当前可见的单元格
        const visibleCells = this.viewSystem.getVisibleCells();
        
        // 更新已探索单元格
        for (const cell of visibleCells) {
            const cellKey = this.getCellKey(cell.x, cell.y);
            
            // 标记为已探索
            if (!this.exploredCells.has(cellKey)) {
                this.exploredCells.add(cellKey);
                
                // 触发单元格探索事件
                this.triggerEvent('onCellExplored', {
                    x: cell.x,
                    y: cell.y,
                    totalExplored: this.exploredCells.size,
                    totalCells: this.config.mazeSize * this.config.mazeSize
                });
            }
        }
    }
    
    /**
     * 检查两点之间是否有视线（简化版）
     * @param {number} x1 - 起点x坐标
     * @param {number} y1 - 起点y坐标
     * @param {number} x2 - 终点x坐标
     * @param {number} y2 - 终点y坐标
     * @returns {boolean} 是否有视线
     */
    hasLineOfSight(x1, y1, x2, y2) {
        // 简化实现：检查直线路径上的墙壁
        // 使用Bresenham算法遍历路径上的所有单元格
        
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
            
            if (!this.maze.canMove(currentX, currentY, moveX, moveY)) {
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
     * 检查单元格是否可见
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 是否可见
     */
    isCellVisible(x, y) {
        return this.viewSystem.isCellVisible(x, y);
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
     * 检查单元格是否已访问
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 是否已访问
     */
    isCellVisited(x, y) {
        const cellKey = this.getCellKey(x, y);
        return this.visitedCells.has(cellKey);
    }
    
    /**
     * 游戏胜利
     */
    victory() {
        this.state.isGameOver = true;
        this.state.isVictory = true;
        this.state.endTime = Date.now();
        this.state.isRunning = false;
        
        // 计算游戏时间
        const gameTime = Math.floor((this.state.endTime - this.state.startTime) / 1000);
        
        // 计算探索率
        const totalCells = this.config.mazeSize * this.config.mazeSize;
        const exploreRate = Math.round((this.exploredCells.size / totalCells) * 100);
        
        // 触发胜利事件
        this.triggerEvent('onVictory', {
            moves: this.state.moves,
            time: gameTime,
            exploreRate: exploreRate,
            exploredCells: this.exploredCells.size,
            totalCells: totalCells
        });
        
        console.log(`游戏胜利！步数: ${this.state.moves}, 时间: ${gameTime}秒, 探索率: ${exploreRate}%`);
    }
    
    /**
     * 游戏失败
     */
    gameOver() {
        this.state.isGameOver = true;
        this.state.isVictory = false;
        this.state.endTime = Date.now();
        this.state.isRunning = false;
        
        // 触发游戏结束事件
        this.triggerEvent('onGameOver', {
            moves: this.state.moves,
            time: Math.floor((this.state.endTime - this.state.startTime) / 1000)
        });
        
        console.log('游戏结束！');
    }
    
    /**
     * 获取游戏状态
     * @returns {Object} 游戏状态
     */
    getGameState() {
        return {
            ...this.state,
            playerPosition: { ...this.player },
            endPosition: this.maze.getEnd(),
            moves: this.state.moves,
            exploredCells: this.exploredCells.size,
            totalCells: this.config.mazeSize * this.config.mazeSize,
            exploreRate: Math.round((this.exploredCells.size / (this.config.mazeSize * this.config.mazeSize)) * 100)
        };
    }
    
    /**
     * 获取游戏统计信息
     * @returns {Object} 游戏统计
     */
    getStats() {
        const totalCells = this.config.mazeSize * this.config.mazeSize;
        const exploreRate = Math.round((this.exploredCells.size / totalCells) * 100);
        
        return {
            moves: this.state.moves,
            explored: this.exploredCells.size,
            total: totalCells,
            exploreRate: exploreRate,
            visited: this.visitedCells.size,
            efficiency: this.state.moves > 0 ? Math.round((this.visitedCells.size / this.state.moves) * 100) : 0
        };
    }
    
    /**
     * 切换视野模式
     * @param {string} mode - 视野模式 ('permanent' 或 'instant')
     */
    setViewMode(mode) {
        if (mode !== 'permanent' && mode !== 'instant') {
            console.error('无效的视野模式:', mode);
            return;
        }
        
        this.viewSystem.setMode(mode);
        this.config.viewMode = mode;
        
        // 更新视野
        this.updateVisibility();
        
        console.log(`视野模式切换为: ${mode === 'permanent' ? '永久显示' : '即时视野'}`);
    }
    
    /**
     * 更改迷宫大小
     * @param {number} size - 迷宫大小
     */
    setMazeSize(size) {
        if (size < 5 || size > 30) {
            console.error('迷宫大小必须在5到30之间');
            return;
        }
        
        this.config.mazeSize = size;
        this.restart();
        
        console.log(`迷宫大小更改为: ${size}×${size}`);
    }
    
    /**
     * 获取解决方案路径
     * @returns {Array} 解决方案路径
     */
    getSolutionPath() {
        return this.maze.getPath();
    }
    
    /**
     * 显示解决方案
     */
    showSolution() {
        this.config.showSolution = true;
        console.log('显示解决方案');
    }
    
    /**
     * 隐藏解决方案
     */
    hideSolution() {
        this.config.showSolution = false;
        console.log('隐藏解决方案');
    }
    
    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            for (const callback of this.eventListeners[event]) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件 ${event} 的回调函数执行错误:`, error);
                }
            }
        }
    }
    
    /**
     * 获取迷宫实例
     * @returns {Maze} 迷宫实例
     */
    getMaze() {
        return this.maze;
    }
    
    /**
     * 获取玩家位置
     * @returns {Object} 玩家位置
     */
    getPlayerPosition() {
        return { ...this.player };
    }
    
    /**
     * 获取视野系统
     * @returns {ViewSystem} 视野系统实例
     */
    getViewSystem() {
        return this.viewSystem;
    }
}

// 导出Game类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}