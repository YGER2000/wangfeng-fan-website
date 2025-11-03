# 非运行依赖清理指南

这份清理单把仓库里与网站线上运行无直接关联的内容分成几类，方便你集中归档或删除。仅整理已经存在于当前仓库中的文件/目录；若你之后又生成新的临时文件，可参照同类规则处理。

## 无条件可删的临时/缓存文件
- `.backend.pid` 、`.frontend.pid`：调试时留下的进程号文件，删除不影响任何启动脚本。
- `.claude/`：AI 辅助工具的本地配置缓存，对项目无依赖。
- `**/.DS_Store`：macOS 自动生成的目录缓存，任何路径下都可以直接清理。
- `logs/backend.log`、`logs/frontend.log`、`logs/backend-restart.log`：历史运行日志，可按需留最近的压缩后备份再清空。

## 可删除但建议先确认的历史数据
- `backups/wangfeng_backup_20251102_205042.sql`：MySQL 导出文件，仅用于手动恢复。
- `backend/uploads/`：旧版本地存储遗留的上传文件；如果所有媒体都迁移到 OSS 并更新了引用，就可以整体移除。
- `backend/public/posters/concerts/**`：仅保留了 info.txt 的历史演出元数据，占空间不大；若演出海报已统一改走 OSS，可打包备份后删除。

## 纯文档类（可整体迁移到 docs/ 或外部知识库）
- `CLAUDE.md`
- `CONTENT_STATUS_DESIGN.md`
- `DEPLOYMENT_GUIDE.md`
- `DOCKER_DEPLOYMENT_WITH_DATA_MIGRATION.md`
- `Docker迁移与一键部署指南.md`
- `OSS海报迁移操作指南.md`
- `存储现状与迁移建议.md`
- `开发日志.md`
- `Todo/` 目录下的所有笔记，例如 `Todo/开发维护计划.md`、`Todo/两步式文章发布功能说明.md` 等

> 以上文件不参与构建与运行，可直接搬迁到 `docs/` 或外部文档系统再从仓库根目录删除。

## 备份/草稿源码
- `frontend/src/components/pages/*.bak`：早期页面备份文件（如 `frontend/src/components/pages/Discography.tsx.bak`），当前构建不会引用。
- `parse_lyrics.py` 与 `data/汪峰歌词集.txt`：歌词批处理脚本与原始数据，仅在离线任务中使用。
- `scripts/upload_music_to_oss.py`、`scripts/upload-music-to-oss.sh`：辅助迁移音乐到 OSS 的工具；若改用其他流程可移除。
- `backend/generated_music_tags.json`、`backend/import_music_tags.py` 等一次性脚本：如果后续不再执行同类迁移，可归档后删除。

## 建议保留
- `Dockerfile`、`start.sh`/`stop.sh`、`backend/init_*.py` 等仍属于部署或初始化工具；只有在明确不再需要相应工作流时再考虑移除。
- `frontend/public/music/` 目前仍被页面引用，在完成 OSS 迁移并更新前端 URL 之前不要删除。

如需进一步核对，可执行 `find . -name ".DS_Store"`、`find . -name "*.bak"` 等命令批量定位临时文件，并与上表对照清理即可。
