-- 游戏排行榜功能数据库迁移脚本
-- 执行此脚本以添加排行榜支持

-- 1. 添加新列到 game_scores 表
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS player_name VARCHAR(100) NULL;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NULL;

-- 2. 创建复合索引以优化排行榜查询性能
CREATE INDEX IF NOT EXISTS idx_game_scores_game_difficulty_score ON game_scores(game_id, difficulty, score DESC);

-- 3. 验证脚本执行成功（查看表结构）
-- DESC game_scores;

-- 注意：
-- - player_name: 玩家输入的名字，允许为 NULL（向后兼容）
-- - difficulty: 游戏难度（easy/hard），允许为 NULL（向后兼容）
-- - 复合索引用于加速排行榜查询：WHERE game_id = ? AND difficulty = ? ORDER BY score DESC
