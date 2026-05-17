# AI Travel Planner

基于 FastAPI + LangGraph + Next.js 的 AI 旅游行程规划系统。

## 系统架构

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│ Frontend │────▶│  FastAPI     │────▶│  Agent    │
│ :3000    │     │  :8000       │     │  Worker   │
└──────────┘     └──────┬───────┘     └─────┬─────┘
                        │                    │
                        ▼                    ▼
                   ┌──────────┐       ┌──────────┐
                   │  MySQL   │       │  Redis   │
                   │   DB     │       │ Queue/Pub│
                   └──────────┘       └──────────┘
```

- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: FastAPI (Python 3.11+)
- **Agent**: LangGraph ReAct Agent，支持工具注册中心 + RAG 语义搜索
- **Queue**: Redis List (任务队列) + Pub/Sub (SSE 事件流)
- **Database**: MySQL 8.0+ via SQLAlchemy (async)
- **Vector DB**: ChromaDB (本地持久化)

## 快速开始

### 前置条件

- Python 3.11+
- Node.js 20+
- MySQL 8.0+
- Redis 7+

### 1. 克隆项目

```bash
git clone https://github.com/boooluochuixue/ai-travel-project.git
cd ai-travel-project
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少需要配置：
- **LLM 配置**：填入你的 API Key（支持 Anthropic / OpenAI / DeepSeek 等）
  ```env
  LLM_PROVIDER=openai_compatible
  LLM_API_KEY=sk-xxxxxxxxxxxx
  LLM_BASE_URL=https://api.deepseek.com/v1
  LLM_MODEL=deepseek-v4-flash
  ```
- **MySQL 配置**：确保用户名密码正确

### 3. 创建数据库

```bash
mysql -u root -e "CREATE USER IF NOT EXISTS 'travel_planner'@'localhost' IDENTIFIED BY 'changeme';"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS travel_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "GRANT ALL ON travel_planner.* TO 'travel_planner'@'localhost';"
```

### 4. 启动 MySQL 和 Redis

```bash
# macOS (Homebrew)
brew services start mysql
brew services start redis

# 或者用 Docker
docker compose up -d mysql redis
```

### 5. 初始化 Python 环境

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### 6. 数据库迁移

```bash
alembic upgrade head
```

### 7. 构建 RAG 索引

```bash
python -m src.services.rag.seed_index
```

### 8. 安装前端依赖

```bash
cd frontend
npm install
```

### 9. 启动服务（分别开 3 个终端窗口）

```bash
# 终端 1 - 后端 API
source .venv/bin/activate
python -m src.main

# 终端 2 - Agent Worker
source .venv/bin/activate
python -m src.services.queue.consumer

# 终端 3 - 前端
cd frontend
npm run dev
```

或者一键启动：

```bash
bash start.sh
```

> **注意**：一键脚本使用 `brew` 命令，仅适用于 macOS。Linux 用户请手动启动服务。

### 10. 访问

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## LLM 配置

支持三种 Provider，通过 `LLM_PROVIDER` 切换：

| Provider | 说明 | 示例值 |
|----------|------|--------|
| `anthropic` | Anthropic Claude (默认) | LLM_MODEL=claude-sonnet-4-20250514 |
| `openai` | OpenAI | LLM_MODEL=gpt-4o |
| `openai_compatible` | OpenAI 兼容接口 | DeepSeek / OpenRouter / Ollama |

## 项目结构

```
src/
├── agent/              # AI Agent
│   ├── registry.py     # 工具注册中心 (@register_tool)
│   ├── prompts/        # ReAct 系统提示词
│   ├── tools/          # 工具集合 (POI / 天气 / 预算 / 排程 / RAG)
│   └── workflow/       # LangGraph agent 定义
├── api/                # FastAPI 路由
├── common/             # 通用工具和错误处理
├── config/             # 配置 (pydantic-settings)
├── models/             # 数据库表和 Pydantic schemas
└── services/
    ├── cache/          # Redis 客户端
    ├── llm/            # LLM 客户端工厂
    ├── queue/          # 任务队列 (Redis List)
    ├── rag/            # RAG 语义搜索 (ChromaDB)
    └── stream/         # SSE 事件流 (Redis Pub/Sub)
```

## 测试

```bash
pytest tests/ -v
```

## 扩展

### 添加新工具

在 `src/agent/tools/` 下新建文件，使用 `@register_tool()` 装饰器即可自动注册：

```python
from src.agent.registry import register_tool

@register_tool()
async def my_tool(param: str) -> str:
    """工具描述（会被 LLM 读取）"""
    return "result"
```

### 切换 RAG 后端

修改 `src/services/rag/vector_store.py`，将 ChromaDB 替换为 Pinecone / Weaviate / Milvus 等。

### 切换 Embedding 模型

修改 `.env` 中的 `EMBEDDING_MODEL`，支持任何 HuggingFace 模型。
