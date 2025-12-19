/**
 * 隐藏迷宫 - 迷宫生成模块
 * 使用深度优先搜索(DFS)算法生成随机迷宫
 */

class Maze {
    /**
     * 创建迷宫实例
     * @param {number} width - 迷宫宽度（单元格数）
     * @param {number} height - 迷宫高度（单元格数）
     */
    constructor(width = 15, height = 15) {
        this.width = width;
        this.height = height;
        this.cells = []; // 单元格状态
        this.walls = []; // 墙壁状态
        this.start = { x: 0, y: 0 }; // 起点
        this.end = { x: width - 1, y: height - 1 }; // 终点
        this.path = []; // 从起点到终点的路径（用于验证）
        
        this.init();
    }
    
    /**
     * 初始化迷宫数据结构
     */
    init() {
        // 初始化所有单元格为未访问
        this.cells = Array(this.height).fill().map(() => 
            Array(this.width).fill(false)
        );
        
        // 初始化墙壁：true表示有墙，false表示无墙
        // 水平墙壁 (height+1) x width
        this.walls = {
            horizontal: Array(this.height + 1).fill().map(() => 
                Array(this.width).fill(true)
            ),
            vertical: Array(this.height).fill().map(() => 
                Array(this.width + 1).fill(true)
            )
        };
        
        // 设置边界墙壁
        this.setBoundaryWalls();
    }
    
    /**
     * 设置迷宫边界墙壁
     */
    setBoundaryWalls() {
        // 上边界
        for (let x = 0; x < this.width; x++) {
            this.walls.horizontal[0][x] = true;
        }
        
        // 下边界
        for (let x = 0; x < this.width; x++) {
            this.walls.horizontal[this.height][x] = true;
        }
        
        // 左边界
        for (let y = 0; y < this.height; y++) {
            this.walls.vertical[y][0] = true;
        }
        
        // 右边界
        for (let y = 0; y < this.height; y++) {
            this.walls.vertical[y][this.width] = true;
        }
    }
    
    /**
     * 使用深度优先搜索算法生成迷宫
     */
    generate() {
        // 重置迷宫状态
        this.init();
        
        // 随机选择起点
        const startX = Math.floor(Math.random() * this.width);
        const startY = Math.floor(Math.random() * this.height);
        this.start = { x: startX, y: startY };
        
        // 随机选择终点（确保与起点不同）
        let endX, endY;
        do {
            endX = Math.floor(Math.random() * this.width);
            endY = Math.floor(Math.random() * this.height);
        } while (endX === startX && endY === startY);
        this.end = { x: endX, y: endY };
        
        // 使用栈进行深度优先搜索
        const stack = [{ x: startX, y: startY }];
        this.cells[startY][startX] = true; // 标记起点为已访问
        
        // 定义四个方向：上、右、下、左
        const directions = [
            { dx: 0, dy: -1, wallType: 'horizontal', wallIndex: 0 }, // 上
            { dx: 1, dy: 0, wallType: 'vertical', wallIndex: 1 },    // 右
            { dx: 0, dy: 1, wallType: 'horizontal', wallIndex: 1 },  // 下
            { dx: -1, dy: 0, wallType: 'vertical', wallIndex: 0 }    // 左
        ];
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const { x, y } = current;
            
            // 获取当前单元格所有未访问的邻居
            const neighbors = this.getUnvisitedNeighbors(x, y);
            
            if (neighbors.length > 0) {
                // 随机选择一个邻居
                const randomIndex = Math.floor(Math.random() * neighbors.length);
                const neighbor = neighbors[randomIndex];
                
                // 移除当前单元格和邻居之间的墙壁
                this.removeWall(x, y, neighbor.direction);
                
                // 标记邻居为已访问
                this.cells[neighbor.y][neighbor.x] = true;
                
                // 将邻居压入栈中
                stack.push({ x: neighbor.x, y: neighbor.y });
            } else {
                // 如果没有未访问的邻居，回溯
                stack.pop();
            }
        }
        
        // 确保起点和终点之间有路径
        this.ensurePathExists();
        
        // 计算从起点到终点的路径（用于验证）
        this.calculatePath();
        
        return this;
    }
    
    /**
     * 获取未访问的邻居单元格
     * @param {number} x - 当前单元格x坐标
     * @param {number} y - 当前单元格y坐标
     * @returns {Array} 未访问的邻居列表
     */
    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1, direction: 'up' },    // 上
            { dx: 1, dy: 0, direction: 'right' },  // 右
            { dx: 0, dy: 1, direction: 'down' },   // 下
            { dx: -1, dy: 0, direction: 'left' }   // 左
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            // 检查是否在迷宫范围内
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                // 检查是否未访问
                if (!this.cells[ny][nx]) {
                    neighbors.push({
                        x: nx,
                        y: ny,
                        direction: dir.direction
                    });
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * 移除两个单元格之间的墙壁
     * @param {number} x - 当前单元格x坐标
     * @param {number} y - 当前单元格y坐标
     * @param {string} direction - 方向 ('up', 'right', 'down', 'left')
     */
    removeWall(x, y, direction) {
        switch (direction) {
            case 'up':
                this.walls.horizontal[y][x] = false;
                break;
            case 'right':
                this.walls.vertical[y][x + 1] = false;
                break;
            case 'down':
                this.walls.horizontal[y + 1][x] = false;
                break;
            case 'left':
                this.walls.vertical[y][x] = false;
                break;
        }
    }
    
    /**
     * 确保起点和终点之间有路径
     */
    ensurePathExists() {
        // 使用BFS检查起点到终点的连通性
        const visited = Array(this.height).fill().map(() => 
            Array(this.width).fill(false)
        );
        const queue = [{ x: this.start.x, y: this.start.y }];
        visited[this.start.y][this.start.x] = true;
        
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }  // 左
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // 如果到达终点，返回
            if (current.x === this.end.x && current.y === this.end.y) {
                return;
            }
            
            // 检查所有方向
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                // 检查是否在迷宫范围内
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    // 检查是否有墙壁阻挡
                    if (this.canMove(current.x, current.y, dir.dx, dir.dy)) {
                        // 检查是否未访问
                        if (!visited[ny][nx]) {
                            visited[ny][nx] = true;
                            queue.push({ x: nx, y: ny });
                        }
                    }
                }
            }
        }
        
        // 如果没有路径，创建一条路径
        this.createPathToEnd();
    }
    
    /**
     * 创建从起点到终点的路径
     */
    createPathToEnd() {
        let x = this.start.x;
        let y = this.start.y;
        
        // 逐步向终点移动，移除沿途的墙壁
        while (x !== this.end.x || y !== this.end.y) {
            // 决定移动方向（优先水平方向）
            if (x < this.end.x) {
                // 向右移动
                this.walls.vertical[y][x + 1] = false;
                x++;
            } else if (x > this.end.x) {
                // 向左移动
                this.walls.vertical[y][x] = false;
                x--;
            } else if (y < this.end.y) {
                // 向下移动
                this.walls.horizontal[y + 1][x] = false;
                y++;
            } else if (y > this.end.y) {
                // 向上移动
                this.walls.horizontal[y][x] = false;
                y--;
            }
            
            // 标记单元格为已访问
            this.cells[y][x] = true;
        }
    }
    
    /**
     * 计算从起点到终点的路径
     */
    calculatePath() {
        // 使用BFS找到最短路径
        const visited = Array(this.height).fill().map(() => 
            Array(this.width).fill(false)
        );
        const parent = Array(this.height).fill().map(() => 
            Array(this.width).fill(null)
        );
        
        const queue = [{ x: this.start.x, y: this.start.y }];
        visited[this.start.y][this.start.x] = true;
        
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }  // 左
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // 如果到达终点，回溯构建路径
            if (current.x === this.end.x && current.y === this.end.y) {
                this.path = this.buildPath(parent, current);
                return;
            }
            
            // 检查所有方向
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                // 检查是否在迷宫范围内
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    // 检查是否有墙壁阻挡且未访问
                    if (this.canMove(current.x, current.y, dir.dx, dir.dy) && !visited[ny][nx]) {
                        visited[ny][nx] = true;
                        parent[ny][nx] = current;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }
        
        // 如果没有找到路径，路径为空数组
        this.path = [];
    }
    
    /**
     * 从父节点映射构建路径
     * @param {Array} parent - 父节点数组
     * @param {Object} end - 终点坐标
     * @returns {Array} 路径坐标数组
     */
    buildPath(parent, end) {
        const path = [];
        let current = end;
        
        while (current !== null) {
            path.unshift(current);
            current = parent[current.y][current.x];
        }
        
        return path;
    }
    
    /**
     * 检查是否可以移动
     * @param {number} x - 当前x坐标
     * @param {number} y - 当前y坐标
     * @param {number} dx - x方向移动量
     * @param {number} dy - y方向移动量
     * @returns {boolean} 是否可以移动
     */
    canMove(x, y, dx, dy) {
        if (dx === 1) { // 向右移动
            return !this.walls.vertical[y][x + 1];
        } else if (dx === -1) { // 向左移动
            return !this.walls.vertical[y][x];
        } else if (dy === 1) { // 向下移动
            return !this.walls.horizontal[y + 1][x];
        } else if (dy === -1) { // 向上移动
            return !this.walls.horizontal[y][x];
        }
        return false;
    }
    
    /**
     * 获取单元格状态
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @returns {boolean} 单元格是否已访问
     */
    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.cells[y][x];
        }
        return false;
    }
    
    /**
     * 获取墙壁状态
     * @param {string} type - 墙壁类型 ('horizontal' 或 'vertical')
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {boolean} 是否有墙
     */
    getWall(type, row, col) {
        if (type === 'horizontal') {
            if (row >= 0 && row <= this.height && col >= 0 && col < this.width) {
                return this.walls.horizontal[row][col];
            }
        } else if (type === 'vertical') {
            if (row >= 0 && row < this.height && col >= 0 && col <= this.width) {
                return this.walls.vertical[row][col];
            }
        }
        return true;
    }
    
    /**
     * 获取迷宫大小
     * @returns {Object} 宽度和高度
     */
    getSize() {
        return { width: this.width, height: this.height };
    }
    
    /**
     * 获取起点坐标
     * @returns {Object} 起点坐标
     */
    getStart() {
        return { ...this.start };
    }
    
    /**
     * 获取终点坐标
     * @returns {Object} 终点坐标
     */
    getEnd() {
        return { ...this.end };
    }
    
    /**
     * 获取路径
     * @returns {Array} 路径坐标数组
     */
    getPath() {
        return [...this.path];
    }
    
    /**
     * 生成固定关卡（预定义的迷宫）
     * @param {number} level - 关卡编号
     */
    generateFixedLevel(level = 1) {
        // 这里可以预定义一些固定关卡
        // 暂时使用随机生成，但保证可重复性
        const seed = level * 12345;
        const originalRandom = Math.random;
        
        // 设置随机种子（简单实现）
        let seedValue = seed;
        Math.random = function() {
            seedValue = (seedValue * 9301 + 49297) % 233280;
            return seedValue / 233280;
        };
        
        // 生成迷宫
        this.generate();
        
        // 恢复原始随机函数
        Math.random = originalRandom;
        
        return this;
    }
    
    /**
     * 生成指定大小的迷宫
     * @param {number} size - 迷宫大小（宽度和高度相同）
     */
    generateWithSize(size) {
        this.width = size;
        this.height = size;
        return this.generate();
    }
}

// 导出Maze类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Maze;
}