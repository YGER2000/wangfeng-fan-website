# 行程系统迁移说明

## 更新内容

### 1. 数据存储迁移
- **之前**：数据存储在 JSON 文件中 (`backend/data/schedule_entries.json`)
- **现在**：数据存储在 MySQL 数据库的 `schedules` 表中

### 2. 图片存储优化
按**分类**和**主题**两级目录结构存储：

```
frontend/public/images/
├── 演唱会/
│   ├── 相信未来巡演西安站/
│   │   └── 相信未来巡演西安站-海报.jpg
│   └── 怒放的生命巡演北京站/
│       └── 怒放的生命巡演北京站-海报.jpg
├── 音乐节/
│   └── 草莓音乐节2025/
│       └── 草莓音乐节2025-海报.jpg
├── 商演/
├── 综艺活动/
└── 其他/
```

**特点**：
- 使用中文文件夹名
- 第一级：分类（演唱会、音乐节、商演、综艺活动、其他）
- 第二级：行程主题（与用户输入的主题名称一致）
- 文件名：`主题名-海报.扩展名`

### 3. 文件命名规则
- **文件夹名**：直接使用中文分类和主题名
- **文件名**：`主题名-海报.jpg`（如果冲突则添加时间戳：`主题名-海报-20250105123456.jpg`）

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

## 安装依赖

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
  "city": "西安",
  "venue": "西安奥体中心体育馆",
  "theme": "相信未来巡演西安站",
  "description": "特别嘉宾：贾轶男",
  "image": [文件]
}
```

## 存储示例

当用户发布行程：
- **分类**: 演唱会
- **主题**: 相信未来巡演西安站
- **上传**: poster.jpg

系统会：
1. 创建目录：`frontend/public/images/演唱会/相信未来巡演西安站/`
2. 保存图片为：`相信未来巡演西安站-海报.jpg`
3. 数据库存储路径：`images/演唱会/相信未来巡演西安站/相信未来巡演西安站-海报.jpg`

## 图片访问路径

上传后的图片可通过以下路径访问：
```
http://localhost:1998/images/演唱会/相信未来巡演西安站/相信未来巡演西安站-海报.jpg
```

## 注意事项

1. 文件夹名称会自动清理不安全字符（如 `/`、`\`、`:`、`*` 等）
2. 保留中文、英文、数字、空格和常用符号
3. 如果同一主题下已存在海报，新上传的会添加时间戳后缀
4. 所有日期会自动标准化为 YYYY-MM-DD 格式

## 数据迁移（如果需要）

如果需要将旧的 JSON 数据迁移到 MySQL：

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
        # 过滤掉不存在的字段
        valid_fields = {
            'category', 'date', 'city', 'venue',
            'theme', 'description', 'image', 'source'
        }
        filtered_entry = {k: v for k, v in entry.items() if k in valid_fields}

        schedule = Schedule(**filtered_entry)
        db.add(schedule)

    db.commit()
    db.close()
    print(f"成功迁移 {len(entries)} 条记录")

if __name__ == "__main__":
    migrate_json_to_mysql()
```

## 启动服务

```bash
# 后端
cd backend
python3 start.py

# 前端
cd frontend
pnpm dev
```

服务启动后，访问 http://localhost:1998 即可使用新的行程系统。
