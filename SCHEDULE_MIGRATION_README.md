# 行程系统迁移说明

## 更新内容

### 1. 数据存储迁移
- **之前**：数据存储在 JSON 文件中 (`backend/data/schedule_entries.json`)
- **现在**：数据存储在 MySQL 数据库的 `schedules` 表中

### 2. 图片存储优化
- **之前**：所有图片统一存储在 `frontend/public/uploads/schedules/`
- **现在**：按分类存储在不同目录：
  - 演唱会 → `frontend/public/schedules/concerts/`
  - 音乐节 → `frontend/public/schedules/festivals/`
  - 商演 → `frontend/public/schedules/commercial/`
  - 综艺活动 → `frontend/public/schedules/variety/`
  - 其他 → `frontend/public/schedules/others/`

### 3. 文件命名规则
- **之前**：`时间戳_UUID.扩展名`（如：`20250105123456_abc123def.jpg`）
- **现在**：`分类-行程主题-海报.扩展名`（如：`演唱会-相信未来巡演-海报.jpg`）

## 数据库表结构

```sql
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(20) NOT NULL,          -- 行程分类
    date VARCHAR(10) NOT NULL,              -- 日期 YYYY-MM-DD
    city VARCHAR(50) NOT NULL,              -- 城市
    venue VARCHAR(200) DEFAULT NULL,        -- 场馆/地点
    theme VARCHAR(200) NOT NULL,            -- 行程主题
    description TEXT DEFAULT NULL,          -- 补充说明
    image VARCHAR(500) DEFAULT NULL,        -- 海报路径
    source VARCHAR(20) NOT NULL,            -- 数据来源
    created_at DATETIME NOT NULL,           -- 创建时间
    updated_at DATETIME NOT NULL            -- 更新时间
);
```

## 安装依赖（如果还没有）

```bash
cd backend
pip3 install -r requirements.txt
```

## 数据库设置

1. 确保 MySQL 已安装并运行
2. 确保数据库 `wangfeng_fan_website` 已创建
3. 运行 SQL 脚本创建表：
```bash
mysql -u root -p wangfeng_fan_website < create_schedules_table.sql
```

## 文件说明

### 新增文件
1. `app/models/schedule_db.py` - Schedule 数据库模型
2. `app/services/schedule_service_mysql.py` - MySQL 版本的行程服务
3. `create_schedules_table.sql` - 创建数据库表的 SQL 脚本

### 修改文件
1. `app/core/dependencies.py` - 更新为使用 MySQL 服务
2. `app/routers/schedules.py` - 更新类型注解
3. `frontend/src/components/pages/PublishSchedule.tsx` - 更新UI提示文字

## API 使用

### 获取所有行程
```bash
GET /api/schedules
```

### 创建行程
```bash
POST /api/schedules
Content-Type: multipart/form-data

{
  "category": "演唱会",
  "date": "2025-10-25",
  "city": "北京",
  "venue": "工人体育场",
  "theme": "相信未来巡演",
  "description": "特别嘉宾：贾轶男",
  "image": [文件]
}
```

## 图片访问路径

上传后的图片可通过以下路径访问：
```
http://localhost:1998/schedules/concerts/演唱会-相信未来巡演-海报.jpg
```

## 注意事项

1. 旧的 JSON 数据不会自动迁移，需要手动导入
2. 图片文件名会自动清理特殊字符，只保留中文、英文、数字和部分符号
3. 如果文件名冲突，会自动添加时间戳后缀
4. 所有日期会自动标准化为 YYYY-MM-DD 格式

## 迁移旧数据（可选）

如果需要迁移旧的 JSON 数据到 MySQL，可以创建迁移脚本：

```python
import json
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.schedule_db import Schedule

def migrate_json_to_mysql():
    db = SessionLocal()

    with open('backend/data/schedule_entries.json', 'r') as f:
        entries = json.load(f)

    for entry in entries:
        schedule = Schedule(**entry)
        db.add(schedule)

    db.commit()
    db.close()
```
