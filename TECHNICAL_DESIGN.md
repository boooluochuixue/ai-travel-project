# AI Travel Planner — 技术方案文档

> 版本：1.0 | 最后更新：2026-05-19

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [技术栈](#3-技术栈)
4. [项目结构](#4-项目结构)
5. [后端架构](#5-后端架构)
6. [前端架构](#6-前端架构)
7. [数据库设计](#7-数据库设计)
8. [Agent 系统设计](#8-agent-系统设计)
9. [核心数据流](#9-核心数据流)
10. [关键设计决策](#10-关键设计决策)
11. [部署方案](#11-部署方案)

---

## 1. 项目概述

AI Travel Planner 是一个基于大语言模型的智能旅行规划系统。用户通过 Web 界面或 REST API 提交旅行需求（目的地、天数、预算、兴趣偏好等），系统利用 LangGraph 驱动的 AI Agent 自主完成目的地调研、景点查询、时间编排、预算分配、酒店推荐等任务，最终输出结构化的完整行程方案。

### 核心特性

- **智能行程生成**：基于 ReAct (Reasoning + Acting) Agent 范式，LLM 自主决策工具调用顺序
- **实时进度推送**：Server-Sent Events (SSE) 实时推送生成进度
- **多酒店选择**：每天行程结束后推荐多家酒店，用户可自由选择
- **语义搜索**：基于 ChromaDB + HuggingFace Embeddings 的 POI 语义检索
- **异步任务队列**：Redis List 实现的生产者-消费者模式，支持任务排队和失败重试
- **多模型支持**：兼容 Anthropic Claude、OpenAI、DeepSeek 等多种 LLM 提供商

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│                  Next.js 16 App Router                        │
│         ┌──────────────┐  ┌──────────────────┐               │
│         │  ItineraryForm│  │ ItineraryDetail  │               │
│         │  (生成表单)    │  │ (行程详情/酒店选择)│               │
│         └──────┬───────┘  └────────┬─────────┘               │
│                │                   │                         │
│         ┌──────┴───────────────────┴─────────┐               │
│         │        API Client (lib/api.ts)       │              │
│         │   SSE Streaming + Polling Fallback   │              │
│         └────────────────┬────────────────────┘               │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTP / SSE
                           ▼
┌──────────────────────────────────────────────────────────┐
│              API Gateway (Next.js Rewrite)                 │
│            /api/* → http://localhost:8000/api/*            │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                  FastAPI Server (Port 8000)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Health  │ │  Cities  │ │   POIs   │ │ Itineraries  │  │
│  │  Router  │ │  Router  │ │  Router  │ │   Router     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────┬───────┘  │
│                                                 │          │
│  ┌──────────────────────────────────────────────▼────────┐ │
│  │              SSE Stream (Redis PubSub)                 │ │
│  │  event_stream() → 订阅 Redis → 转发到 HTTP SSE        │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│    Redis     │ │  MySQL   │ │ ChromaDB │
│  • Cache     │ │  • 用户   │ │  • POI   │
│  • Task Queue│ │  • 城市   │ │  索引    │
│  • Pub/Sub   │ │  • POI   │ │  • 旅行  │
│  • Task State│ │  • 行程   │ │  知识库  │
└──────┬───────┘ │  • 反馈   │ └──────────┘
       │         └──────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              Agent Worker (Consumer)                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  ReAct Agent (LangGraph create_react_agent)          │ │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │ │
│  │  │  System    │ │  Tools     │ │  LLM (DeepSeek   │  │ │
│  │  │  Prompt    │ │  Registry  │ │  /Claude/OpenAI) │  │ │
│  │  └────────────┘ └────────────┘ └──────────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
│  发布 SSE 事件 → Redis PubSub → API Server → 客户端      │
└──────────────────────────────────────────────────────────┘
```

### 分层说明

| 层次 | 组件 | 职责 |
|------|------|------|
| **展示层** | Next.js 前端 | 用户交互界面、表单输入、进度展示、行程查看 |
| **API 层** | FastAPI | RESTful 接口、请求校验、SSE 流式推送 |
| **业务层** | Agent Worker | LLM 驱动的 ReAct Agent、工具调用、行程生成 |
| **数据层** | MySQL + Redis + ChromaDB | 持久化存储、缓存、消息队列、向量检索 |

---

## 3. 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 运行时 |
| FastAPI | 0.115+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM（异步模式） |
| Alembic | 1.14+ | 数据库迁移 |
| LangChain | 0.3+ | LLM 调用框架 |
| LangGraph | 0.3+ | Agent 工作流引擎 |
| Redis (redis-py) | 5.0+ | 缓存 / 队列 / Pub/Sub |
| ChromaDB | 0.5+ | 向量数据库 |
| HuggingFace Transformers | 4.x | Embedding 模型 |
| Pydantic | 2.x | 数据校验 |
| Pydantic-Settings | 2.x | 配置管理 |
| httpx | 0.28+ | HTTP 客户端 |
| uvicorn | 0.33+ | ASGI 服务器 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.6 | 框架（App Router） |
| React | 19.2.4 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 样式 |
| lucide-react | 0.480+ | 图标 |
| date-fns | 4.x | 日期处理 |

### 基础设施

| 技术 | 用途 |
|------|------|
| MySQL 8.0+ | 关系型数据库 |
| Redis 7+ | 缓存 / 队列 / Pub/Sub |
| Docker + Compose | 容器化部署 |

---

## 4. 项目结构

```
project-01/
│
├── src/                              # Python 后端
│   ├── main.py                       # FastAPI 入口
│   ├── config/
│   │   ├── __init__.py               # 导出 settings 单例
│   │   └── settings.py               # Pydantic 配置（.env）
│   ├── api/
│   │   ├── deps.py                   # FastAPI 依赖注入（DB、Redis）
│   │   └── v1/
│   │       ├── router.py             # 路由聚合
│   │       ├── health.py             # 健康检查
│   │       ├── cities.py             # 城市接口
│   │       ├── pois.py               # POI 接口
│   │       ├── itineraries.py        # 行程接口（核心）
│   │       └── users.py              # 用户接口
│   ├── common/
│   │   ├── errors.py                 # 异常层次结构
│   │   └── logger.py                 # 日志配置
│   ├── models/
│   │   ├── database.py               # 异步 SQLAlchemy 引擎
│   │   ├── enums.py                  # 枚举定义
│   │   ├── tables.py                 # ORM 模型
│   │   └── schemas.py                # Pydantic 模式
│   ├── agent/
│   │   ├── registry.py               # 工具注册器
│   │   ├── prompts/
│   │   │   └── react_system.py       # ReAct 系统提示词
│   │   ├── tools/
│   │   │   ├── __init__.py           # 工具模块导入
│   │   │   ├── poi_tools.py          # POI 查询工具
│   │   │   ├── weather_tools.py      # 天气工具（Mock）
│   │   │   ├── budget_tools.py       # 预算工具
│   │   │   ├── schedule_tools.py     # 行程校验工具
│   │   │   ├── hotel_tools.py        # 酒店推荐工具
│   │   │   └── search_rag_tools.py   # 语义搜索工具
│   │   └── workflow/
│   │       ├── state.py              # Agent 状态定义
│   │       └── agent.py              # Agent 构建工厂
│   ├── services/
│   │   ├── cache/redis.py            # Redis 客户端
│   │   ├── llm/client.py             # LLM 工厂
│   │   ├── queue/
│   │   │   ├── redis_queue.py        # 队列操作
│   │   │   └── consumer.py           # 消费者（Worker）
│   │   ├── rag/
│   │   │   ├── embeddings.py         # Embedding 模型
│   │   │   ├── vector_store.py       # ChromaDB 封装
│   │   │   ├── travel_knowledge.py   # 旅行知识库
│   │   │   └── seed_index.py         # 索引初始化脚本
│   │   └── stream/
│   │       ├── manager.py            # SSE 事件流
│   │       └── publisher.py          # 事件发布
│   └── scripts/
│       ├── init_db.sql               # DDL 脚本
│       └── seed_data.py              # 种子数据
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # 根布局
│   │   │   ├── page.tsx              # 首页
│   │   │   └── itineraries/
│   │   │       ├── page.tsx          # 行程列表
│   │   │       └── [id]/page.tsx     # 行程详情
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # 导航栏
│   │   │   ├── ItineraryForm.tsx     # 生成表单
│   │   │   ├── ItineraryTimeline.tsx # 行程时间线
│   │   │   └── ui/
│   │   │       ├── Badge.tsx         # 徽章
│   │   │       └── Card.tsx          # 卡片
│   │   ├── lib/api.ts                # API 客户端
│   │   └── types/index.ts            # TypeScript 类型
│   ├── next.config.ts                # Next.js 配置
│   └── package.json
│
├── tests/
│   ├── conftest.py                   # 测试夹具
│   ├── test_models/                  # 模型测试
│   ├── test_api/                     # API 测试
│   ├── test_agent/                   # Agent 测试
│   ├── test_rag/                     # RAG 测试
│   └── test_stream/                  # SSE 测试
│
├── alembic/                          # 数据库迁移
├── docker-compose.yml                # Docker 编排
├── Dockerfile                        # 后端 Dockerfile
├── .env                              # 环境变量
├── pyproject.toml                    # Python 依赖
├── DESIGN.md                         # 初始设计文档
├── ARCHITECTURE.md                   # 架构概览
└── README.md                         # 快速开始
```

---

## 5. 后端架构

### 5.1 FastAPI 应用入口 (`src/main.py`)

```
┌──────────────────────────────────────────────────┐
│  FastAPI Application                               │
│                                                    │
│  lifespan:                                         │
│    ├── startup: init_redis() (非致命失败)          │
│    └── shutdown: close_redis(), close_db()         │
│                                                    │
│  exception_handlers:                               │
│    └── AppException → 统一 JSON 错误响应           │
│                                                    │
│  routers:                                          │
│    └── /api/v1 → v1_router                        │
└──────────────────────────────────────────────────┘
```

- 使用 `async with lifespan` 管理应用生命周期
- Redis 连接失败不阻止启动（本地开发容错）
- 全局异常处理器确保所有错误返回统一格式的 JSON

### 5.2 配置管理 (`src/config/settings.py`)

基于 `pydantic-settings`，从 `.env` 文件加载：

```python
class Settings(BaseSettings):
    # 应用
    app_name: str = "travel-planner"
    app_debug: bool = True
    
    # 数据库
    db_host: str = "localhost"
    db_url: str  # @property: mysql+aiomysql://...
    
    # Redis
    redis_host: str = "localhost"
    redis_url: str  # @property
    
    # 队列
    generation_queue: str = "itinerary:generate"
    refine_queue: str = "itinerary:refine"
    
    # LLM
    llm_provider: str  # anthropic | openai | openai_compatible
    llm_model: str
    llm_api_key: Optional[str]
    llm_base_url: Optional[str]
    llm_max_tokens: int = 8192
    
    # RAG
    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "all-MiniLM-L6-v2"
```

### 5.3 API 路由设计

所有响应统一包裹：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/v1/health` | GET | 基础健康检查 |
| `/api/v1/health/detail` | GET | 详细健康检查（含 MySQL/Redis 状态） |
| `/api/v1/cities` | GET | 城市列表（支持 keyword 搜索） |
| `/api/v1/cities/{id}` | GET | 城市详情 |
| `/api/v1/pois` | GET | POI 搜索（支持 city_id/city_name/category/keyword 过滤） |
| `/api/v1/pois/categories` | GET | POI 分类列表 |
| `/api/v1/pois/{id}` | GET | POI 详情 |
| `/api/v1/itineraries/generate` | POST | 提交行程生成任务 |
| `/api/v1/itineraries/generate/stream/{task_id}` | GET | SSE 实时进度流 |
| `/api/v1/itineraries/generate/{task_id}/status` | GET | 任务状态轮询 |
| `/api/v1/itineraries` | GET | 行程列表 |
| `/api/v1/itineraries/{id}` | GET | 行程详情（含天、时段、酒店） |
| `/api/v1/itineraries/{id}/refine` | POST | 提交行程优化 |
| `/api/v1/itineraries/{id}/confirm` | POST | 确认行程 |
| `/api/v1/itineraries/{id}/days/{day_number}/select-hotel` | POST | 选择酒店 |
| `/api/v1/itineraries/{id}` | DELETE | 删除（软删除: cancelled） |
| `/api/v1/users` | POST | 创建用户 |
| `/api/v1/users/{id}` | GET | 用户详情 |

### 5.4 依赖注入 (`src/api/deps.py`)

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖：每个请求一个数据库会话，自动提交/回滚"""
    async with async_session_factory() as session:
        yield session
        await session.commit()
```

### 5.5 异常层次结构 (`src/common/errors.py`)

```
AppException (extends HTTPException)
├── BadRequestError      (400, 40000)
├── NotFoundError        (404, 40400)
├── ConflictError        (409, 40900)
├── LLMOutputError       (422, 42200)
├── RateLimitError       (429, 42900)
├── InternalError        (500, 50000)
├── LLMAPIError          (502, 50200)
└── ServiceUnavailableError (503, 50300)
```

---

## 6. 前端架构

### 6.1 页面路由

```
/                          # 首页（表单 + 生成进度）
/itineraries              # 行程列表
/itineraries/[id]         # 行程详情
```

### 6.2 组件树

```
Layout
├── Navbar
└── Page Content
    ├── Home Page
    │   └── ItineraryForm
    │       ├── DestinationSelector（动态目的地行）
    │       ├── InterestPicker（兴趣标签）
    │       ├── BudgetPaceInput（预算/节奏）
    │       └── ProgressPanel（假进度条动画）
    │
    ├── Itinerary List Page
    │   ├── LoadingSkeleton
    │   ├── EmptyState
    │   └── ItineraryCard[]
    │
    └── Itinerary Detail Page
        ├── Header（标题、状态、目的地、预算）
        ├── BudgetBreakdown（预算分配卡片）
        └── ItineraryTimeline
            ├── DayBlock[]
            │   ├── DayHeader（日期、天气）
            │   ├── SlotCard[]（时段卡片）
            │   └── HotelSelection（酒店选择）
            │       ├── HotelOption[]（酒店选项）
            │       └── BookingButton（预订按钮）
```

### 6.3 SSE 流式连接 (`lib/api.ts`)

```typescript
streamGeneration(taskId, callbacks)
  │
  ├── EventSource → /api/v1/itineraries/generate/stream/{taskId}
  │     ├── onmessage → 解析 JSON → 分发到回调
  │     └── onerror → 最多 5 次重连后放弃
  │
  └── 轮询兜底（每 3 秒）
        └── GET /api/v1/itineraries/generate/{taskId}/status
              └── status === "completed" → 触发 onComplete
```

### 6.4 进度条策略

前端使用**假进度动画**（非真实后端事件驱动），避免因网络波动或后端延迟导致用户无反馈：

```
点击生成 →
  ├── 阶段文字每 10 秒切换（共 5 个阶段）
  ├── 进度 0% → 快速到 15% → 渐近趋近 90%
  │   公式: progress += (90 - progress) * 0.03 + 0.5
  └── 后端完成 → 跳到 100% → 延迟 400ms → 跳转详情页
```

### 6.5 API 代理

```
next.config.ts → rewrites:
  /api/:path* → http://localhost:8000/api/:path*
```

---

## 7. 数据库设计

### 7.1 ER 概览

```
users 1──N itineraries 1──N itinerary_days 1──N itinerary_slots
                                        │
                                        └── hotel (JSON), hotel_options (JSON)
cities 1──N pois

itineraries 1──N feedback
       │
       └── user_id (nullable)
```

### 7.2 表结构

#### users

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AI | 用户 ID |
| nickname | VARCHAR(64) | 昵称 |
| email | VARCHAR(256) UNIQUE | 邮箱 |
| preferences | JSON | 偏好设置 |
| status | TINYINT | 状态: 1=正常 |

#### cities

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AI | 城市 ID |
| name | VARCHAR(32) | 中文名（索引） |
| name_en | VARCHAR(64) | 英文名 |
| province | VARCHAR(32) | 省份 |
| latitude/longitude | DECIMAL(10,7) | 经纬度 |
| status | TINYINT | 状态: 1=正常 |

#### pois

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AI | POI ID |
| city_id | BIGINT FK → cities | 所属城市 |
| name | VARCHAR(256) | 名称 |
| category | VARCHAR(32) INDEX | 分类（attraction/restaurant/hotel/shopping/entertainment） |
| sub_category | VARCHAR(64) | 子分类（如：烤鸭店、博物馆） |
| address | VARCHAR(512) | 地址 |
| rating | DECIMAL(2,1) | 评分 |
| price_level | TINYINT | 价格等级 1-3 |
| visit_duration | INT | 建议游览时长（分钟） |
| status | TINYINT | 状态 |

#### itineraries

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AI | 行程 ID |
| user_id | BIGINT FK → users | 用户 ID（可空） |
| title | VARCHAR(256) | 行程标题 |
| destinations | JSON | 目的地列表 `[{city_id, city_name, days}]` |
| total_budget | DECIMAL(12,2) | 总预算 |
| budget_breakdown | JSON | 预算分配 |
| preferences | JSON | 偏好设置 |
| status | ENUM | draft/confirmed/completed/cancelled |
| raw_plan | LONGTEXT | Agent 原始输出 |

#### itinerary_days

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AI | 天 ID |
| itinerary_id | BIGINT FK → itineraries (CASCADE) | 所属行程 |
| day_number | INT | 第 N 天 |
| hotel | JSON | 选中酒店 `{name, address, rating, ...}` |
| hotel_options | JSON | 多个酒店选项 `[{...}, {...}]` |
| weather_forecast | JSON | 天气预报 |

#### itinerary_slots

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK AI | 时段 ID |
| day_id | BIGINT FK → itinerary_days (CASCADE) | 所属天 |
| slot_type | ENUM | morning/afternoon/evening |
| poi_name | VARCHAR(256) | POI 名称 |
| poi_category | VARCHAR(64) | POI 分类 |
| start_time/end_time | VARCHAR(16) | 时间范围 |
| duration | INT | 时长（分钟） |
| cost | DECIMAL(10,2) | 预估费用 |
| transport_tip | TEXT | 交通建议 |
| sort_order | INT | 排序序号 |

### 7.3 索引策略

所有表使用 InnoDB、utf8mb4 字符集。关键索引：
- `cities`: `name` 普通索引
- `pois`: `city_id` FK 索引, `category` 普通索引, `(city_id, category)` 复合索引
- `itineraries`: `user_id` FK 索引, `status` 普通索引
- `itinerary_days`: `itinerary_id` FK 索引, `(itinerary_id, day_number)` 唯一索引
- `itinerary_slots`: `day_id` FK 索引, `(day_id, sort_order)` 复合索引

---

## 8. Agent 系统设计

### 8.1 架构选择

使用 **LangGraph `create_react_agent`**（预构建 ReAct Agent），而非自定义 StateGraph。

**理由：**
- ReAct 范式成熟稳定，适合工具调用密集场景
- `create_react_agent` 内置了 LLM 调用、工具执行、消息历史的循环逻辑
- 无需手写条件边和状态管理
- 单系统提示词即可定义 Agent 行为

### 8.2 Agent 流程

```
用户输入（JSON）
    │
    ▼
┌─────────────────────────────────────┐
│  ReAct Agent Loop                    │
│                                      │
│  ┌──────────┐    ┌───────────┐      │
│  │ LLM 思考  │───▶│  调用工具  │      │
│  │ (推理/规划)│    │  (执行)   │      │
│  └────┬─────┘    └─────┬─────┘      │
│       │                │            │
│       └────────────────┘            │
│       ◄────── 循环 ──────►          │
│                                      │
│  直到 LLM 输出最终 JSON 或达到最大步数 │
└─────────────────────────────────────┘
    │
    ▼
最终 JSON 输出 → 保存数据库 → 发布完成事件
```

### 8.3 系统提示词设计

系统提示词定义在 `src/agent/prompts/react_system.py`，包含：

```
1. 角色定义：专业 AI 旅游规划师
2. 核心原则（6条）：
   - 时间合理：3-5 活动/天
   - 地理聚类：同一天景点地理集中
   - 节奏适中：留出用餐休息时间
   - 预算合理：匹配用户预算等级
   - 个性化：根据兴趣偏好定制
   - 酒店推荐：靠近当天活动区域
3. 可用工具列表（自动注册）
4. 工作方式说明
5. 严格 JSON 输出格式（含完整 schema 示例）
```

### 8.4 工具列表

| 工具名 | 输入 | 功能 | 缓存 |
|--------|------|------|------|
| `get_city_info` | city_name | 查询城市基本信息 | Redis 24h |
| `search_pois` | city_name, categories, keywords | 按条件搜索 POI | Redis 1h |
| `get_weather` | city_name, date | 天气预报（Mock） | ❌ |
| `calculate_budget` | total, ratios | 预算分配计算 | ❌ |
| `validate_schedule` | slots | 行程合理性校验 | ❌ |
| `recommend_hotel` | city_name, max_price_level, min_rating, limit | 推荐酒店 | Redis 1h |
| `semantic_search_pois` | city, query, k | 语义搜索 POI | ❌ |
| `retrieve_travel_knowledge` | query, k | 旅行知识检索 | ❌ |

### 8.5 工具注册机制

```python
# registry.py
_registry: dict[str, BaseTool] = {}

def register_tool(*, name: str | None = None):
    """装饰器：将异步函数注册为 LangChain 工具"""
    def decorator(func):
        t = tool(func)
        _registry[t.name] = t
        return t
    return decorator

# 使用示例
@register_tool()
async def recommend_hotel(city_name: str, ...) -> list[dict]:
    ...
```

工具模块在 `tools/__init__.py` 中统一导入，触发装饰器注册：

```python
# tools/__init__.py
import src.agent.tools.poi_tools      # 注册 get_city_info, search_pois
import src.agent.tools.weather_tools   # 注册 get_weather
import src.agent.tools.budget_tools    # 注册 calculate_budget
import src.agent.tools.schedule_tools  # 注册 validate_schedule
import src.agent.tools.hotel_tools     # 注册 recommend_hotel
import src.agent.tools.search_rag_tools # 注册 semantic_search_pois, retrieve_travel_knowledge
```

### 8.6 LLM 多提供商支持

```python
def _build_model() -> BaseChatModel:
    provider = settings.llm_provider
    
    if provider == "anthropic":
        return ChatAnthropic(model=..., api_key=...)
    if provider == "openai":
        return ChatOpenAI(model=..., api_key=...)
    if provider == "openai_compatible":
        return ChatOpenAI(model=..., base_url=..., api_key=...)
```

当前配置（`.env`）：
- Provider: `openai_compatible` (DeepSeek)
- Model: `deepseek-v4-flash`
- Base URL: `https://api.deepseek.com/v1`

---

## 9. 核心数据流

### 9.1 行程生成流程

```
用户                    前端                     API                   Worker                 LLM/工具
 │                       │                       │                      │                       │
 │  填写表单               │                       │                      │                       │
 ├──────────────────────►│                       │                      │                       │
 │                       │                       │                      │                       │
 │                       │  POST /generate        │                      │                       │
 │                       ├──────────────────────►│                      │                       │
 │                       │                       │  创建 task_id         │                       │
 │                       │                       │  Redis: pending      │                       │
 │                       │                       │  Enqueue → LPUSH     │                       │
 │                       │                       ├─────────────────────►│                       │
 │                       │                       │                      │                       │
 │                       │  { task_id }           │                      │                       │
 │                       │◄──────────────────────┤                      │                       │
 │                       │                       │                      │                       │
 │  显示进度条            │  SSE 连接              │                      │                       │
 │◄──────────────────────┤─────────────────────────────────────────────►│                       │
 │                       │                       │                      │                       │
 │  "1/5 分析需求中..."  │  progress event        │                      │  on_chat_model_start   │
 │◄──────────────────────┤◄──────────────────────│◄─────────────────────┤◄──────────────────────│
 │                       │                       │                      │                       │
 │                       │  tool_call event       │                      │  get_city_info         │
 │                       │◄──────────────────────│◄─────────────────────┤──────────────────────►│
 │                       │                       │                      │                       │
 │                       │  tool_result event     │                      │  ◄── DB 查询结果 ────│
 │                       │◄──────────────────────│◄─────────────────────┤                       │
 │                       │                       │                      │                       │
 │  "2/5 搜索景点..."    │  progress event        │                      │  on_chat_model_start   │
 │◄──────────────────────┤◄──────────────────────│◄─────────────────────┤◄──────────────────────│
 │                       │                       │                      │                       │
 │                       │  ... (更多工具调用)     │                      │                       │
 │                       │                       │                      │                       │
 │                       │  complete event        │                      │                       │
 │◄──────────────────────┤◄──────────────────────│◄─────────────────────┤  Agent 结束            │
 │                       │                       │                      │                       │
 │                       │                       │                      │  save_itinerary()      │
 │ 跳转 /itineraries/{id}│                       │                      │  → MySQL INSERT        │
 │◄──────────────────────┤                       │                      │                       │
 │                       │                       │                      │                       │
```

### 9.2 SSE 事件流机制

```
Worker (发布者)                 Redis PubSub               API Server (订阅者)
     │                             │                            │
     │  publish_event()             │                            │
     │  ──────────────────────────►│                            │
     │  PUBLISH task:{id}:events   │                            │
     │                             │  ───────────────────────►  │  event_stream()
     │                             │                            │  yield "data: {json}\n\n"
     │                             │                            │         │
     │                             │                            │         ▼
     │                             │                            │  StreamingResponse
     │                             │                            │  → SSE to Client
```

事件格式：

```json
{"type": "thought", "data": {"content": "分析旅行需求中..."}}
{"type": "tool_call", "data": {"name": "search_pois", "input": {...}}}
{"type": "tool_result", "data": {"name": "search_pois", "output": "..."}}
{"type": "progress", "data": {"progress": 0.4, "step": 2, "total_steps": 5, "current_stage": "搜索景点信息中"}}
{"type": "complete", "data": {"itinerary_id": 1, "message": "行程生成完成"}}
{"type": "error", "data": {"message": "..."}}
```

### 9.3 酒店选择流程

```
用户                   前端 API (fetch)            API 后端              MySQL
 │                       │                         │                     │
 │  点击"选择"酒店       │                         │                     │
 ├──────────────────────►│                         │                     │
 │                       │                         │                     │
 │                       │  POST /{id}/days/{n}/   │                     │
 │                       │  select-hotel {hotel}   │                     │
 │                       ├────────────────────────►│                     │
 │                       │                         │  UPDATE hotel       │
 │                       │                         │  WHERE id=         │
 │                       │                         ├────────────────────►│
 │                       │                         │                     │
 │                       │  { code: 0 }            │                     │
 │                       │◄────────────────────────┤                     │
 │                       │                         │                     │
 │  选中状态 + √ 图标    │                         │                     │
 │◄──────────────────────┤                         │                     │
 │                       │                         │                     │
```

---

## 10. 关键设计决策

### 10.1 为什么用 Redis Lists 而非 Kafka？

- 开发环境零依赖：Redis 比 Kafka 轻量，本地启动快
- 队列规模适中：单机应用，不需要 Kafka 的分区、副本等特性
- 后续可迁移：队列接口（enqueue/dequeue）抽象良好，可替换为 Kafka

### 10.2 为什么用 ReAct Agent 而非自定义 StateGraph？

- 初始设计文档描述了一个 6 节点自定义 StateGraph（collect_info → plan → search → arrange → budget → output），但实现中选择了 `create_react_agent`
- 原因：ReAct 范式更灵活，LLM 自主决定工具调用顺序，无需硬编码状态转移
- 对于工具数量适中（8个）的场景，单系统提示词 + ReAct 循环已足够，自定义 StateGraph 增加了不必要的复杂度

### 10.3 为什么用假进度条？

- 真实进度依赖 SSE 事件流，但网络波动或后端延迟可能导致用户无反馈
- 假进度条采用渐近趋近算法（先快后慢，趋近 90%），配合阶段文字切换，给用户"一直在推进"的感知
- 后端完成时立即跳到 100%，不影响实际跳转时机

### 10.4 为什么 SSE + 轮询双策略？

- SSE (EventSource) 提供实时推送，但：
  - 连接可能中断（EventSource 会重连，但可能错过已发布的事件）
  - Redis PubSub 是"发后即忘"的，没有消息持久化
- 轮询兜底（每 3 秒检查 Redis 中的任务状态）保证即使 SSE 完全失效，也能检测到任务完成
- SSE 端点本身也做了优化：建立连接时先检查 Redis 中任务状态，如果已完成则立即返回

### 10.5 前端与后端的关系

- 前端通过 Next.js Rewrite `/api/*` → `localhost:8000/api/*`，避免跨域问题
- 前端使用 `'use client'` 组件，SSR 主要用于首屏加载，交互逻辑全在客户端
- 类型定义（TypeScript `types/index.ts`）与后端 Pydantic Schema 保持同步

### 10.6 安全与隐私

- 后端 API 当前无认证机制（开发阶段）
- 酒店数据通过百度搜索跳转（用户点击预订时在新标签页打开搜索）
- LLM API Key 存储在 `.env` 文件中，不提交到版本控制
- 所有用户输入经过 Pydantic 校验

---

## 11. 部署方案

### 11.1 Docker 部署

```yaml
# docker-compose.yml
services:
  mysql:        # MySQL 8.0
  redis:        # Redis 7
  api:          # FastAPI + uvicorn (port 8000)
  agent-worker: # 消费者进程
```

### 11.2 本地开发启动

```bash
# 1. 启动基础设施
brew services start mysql
brew services start redis

# 2. 初始化数据库
mysql -uroot < src/scripts/init_db.sql

# 3. 安装依赖 & 启动
pip install -e .
python -m src.main                    # API (port 8000)
python -m src.services.queue.consumer  # Worker

# 4. 前端
cd frontend && npm install && npx next dev --webpack  # (port 3000)
```

### 11.3 环境变量

```ini
# .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=travel_planner
DB_PASSWORD=changeme
DB_NAME=travel_planner

REDIS_HOST=localhost
REDIS_PORT=6379

LLM_PROVIDER=openai_compatible
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-v4-flash
```

### 11.4 依赖管理

- Python: `pyproject.toml`（pip install -e . 安装所有依赖）
- 前端: `package.json`（npm install）
- 数据库迁移: Alembic（`alembic upgrade head`）

---

## 附录 A：AppException 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| 40000 | 400 | 请求参数错误 |
| 40400 | 404 | 资源不存在 |
| 40900 | 409 | 资源冲突 |
| 42200 | 422 | LLM 输出解析错误 |
| 42900 | 429 | 请求频率限制 |
| 50000 | 500 | 服务器内部错误 |
| 50200 | 502 | LLM API 调用失败 |
| 50300 | 503 | 服务暂不可用 |

## 附录 B：种子数据

| 城市 | POI 数量 | 酒店数量 | 特色 |
|------|----------|----------|------|
| 北京 | 20+ | 3 | 故宫、长城、烤鸭、胡同 |
| 上海 | 20+ | 3 | 外滩、迪士尼、本帮菜 |
| 成都 | 18+ | 3 | 熊猫、火锅、宽窄巷子 |
| 西安 | 15+ | 3 | 兵马俑、大雁塔、羊肉泡馍 |
| 大理 | 12+ | 3 | 洱海、苍山、古城 |
