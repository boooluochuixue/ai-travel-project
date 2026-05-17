# AI 旅游场景规划 Agent — 项目设计文档

> 版本: v1.0
> 状态: 设计阶段

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [模块设计](#3-模块设计)
4. [数据模型](#4-数据模型)
5. [API 设计](#5-api-设计)
6. [Agent 工作流设计](#6-agent-工作流设计)
7. [消息与缓存设计](#7-消息与缓存设计)
8. [错误处理与日志](#8-错误处理与日志)
9. [安全设计](#9-安全设计)
10. [测试策略](#10-测试策略)
11. [部署架构](#11-部署架构)
12. [开发路线图](#12-开发路线图)

---

## 1. 项目概述

### 1.1 项目目标

构建一个基于大语言模型的智能旅游规划助手系统（"Travel Planner Agent"）。用户通过 REST API 提交旅行需求，系统利用 LangChain Agent 自动完成目的地研究、POI 检索、时间排程、预算分配等任务，最终输出结构化的完整行程方案。

### 1.2 核心用例

| 用例 | 描述 | 优先级 |
|------|------|--------|
| 单城市行程生成 | 用户指定城市、天数、偏好，生成完整行程 | P0 |
| 行程精调 | 用户对已有行程提出修改意见，Agent 重新规划 | P0 |
| 行程查询 | 查看已生成的行程详情 | P1 |
| 多城市连线 | 跨城市行程自动衔接与交通规划 | P2 |
| 多人行程协作 | 多用户共同编辑一份行程 | P3 |

### 1.3 关键约束

- 所有 Agent 调用通过 LangChain 框架完成
- 数据持久化使用 MySQL（不使用文件存储）
- 异步任务通过 Kafka 消息驱动
- 行程生成过程可能耗时较长（10-30s），采用异步模式

---

## 2. 系统架构

### 2.1 分层架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│              HTTP Client / Web / Mobile / CLI                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST (JSON)
┌──────────────────────────┴───────────────────────────────────────┐
│                       API GATEWAY                                │
│              FastAPI (路由 / 鉴权 / 限流 / 参数校验)              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Agent Orchestrator                      │    │
│  │  LangGraph Workflow: 6-Node StateGraph                    │    │
│  │  GatherInfo → Research → Plan → Detail → Optimize →      │    │
│  │  Present → [Refine loop]                                  │    │
│  └──────────────────┬───────────────────────────────────────┘    │
│                     │                                            │
│  ┌──────────┐ ┌─────┴──────┐ ┌──────────┐ ┌──────────────┐     │
│  │ Itinerary│ │ POI Search │ │  User    │ │ Budget       │     │
│  │ Service  │ │ Service    │ │ Service  │ │ Service      │     │
│  └──────────┘ └─────┬──────┘ └──────────┘ └──────────────┘     │
│                     │                                            │
└──────────────────────┼────────────────────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────────────────────┐
│                     MIDDLEWARE LAYER                              │
│  ┌──────────┐  ┌────┴──────┐                                     │
│  │  Redis   │  │   Kafka   │                                     │
│  │ • 会话   │  │ • 生成任务 │                                     │
│  │ • 缓存   │  │ • POI同步  │                                     │
│  │ • 限流   │  │ • 通知     │                                     │
│  └──────────┘  └───────────┘                                     │
└───────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────────────────────┐
│                    DATA LAYER                                     │
│  ┌──────────┐  ┌────┴────────┐  ┌──────────────┐                │
│  │  MySQL   │  │  External   │  │  LLM (Claude)│                 │
│  │ • 业务表  │  │  • 高德地图 │  │  • ChatAnthropic              │
│  │ • 配置表  │  │  • 和风天气 │  │  • PDF响应解析                 │
│  └──────────┘  └─────────────┘  └──────────────┘                │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 架构原则

1. **关注点分离** — Agent 编排、业务逻辑、数据访问严格分层
2. **异步优先** — 长时间任务（行程生成）通过 Kafka 异步处理
3. **无状态服务** — 应用层无状态，会话状态存储在 Redis
4. **可观测性** — 全链路日志追踪，关键指标暴露

---

## 3. 模块设计

### 3.1 模块划分

```
travel-planner/
├── api/                  # API 层 (路由/控制器)
│   ├── v1/               # API v1 版本
│   │   ├── itineraries   # 行程相关接口
│   │   ├── pois          # POI 检索接口
│   │   ├── cities        # 城市信息接口
│   │   └── users         # 用户接口
├── agent/                # Agent 编排层
│   ├── workflow/         # LangGraph 工作流定义
│   ├── tools/            # Agent 工具定义
│   └── prompts/          # 提示词模板
├── core/                 # 核心业务逻辑
│   ├── itinerary/        # 行程服务
│   ├── poi/              # POI 服务
│   ├── budget/           # 预算服务
│   └── scheduler/        # 时间排程引擎
├── models/               # 数据模型 (SQLAlchemy + Pydantic)
├── services/             # 基础设施服务
│   ├── llm/              # LLM 客户端封装
│   ├── cache/            # Redis 缓存服务
│   ├── queue/            # Kafka 消息队列服务
│   └── external/         # 外部 API 客户端
├── common/               # 公共模块
│   ├── errors/           # 错误定义
│   ├── logger/           # 日志配置
│   └── utils/            # 工具函数
└── config/               # 配置管理
```

### 3.2 核心模块职责

#### 3.2.1 Agent 模块 (`agent/`)

| 子模块 | 职责 |
|--------|------|
| `workflow/graph.py` | 定义 LangGraph StateGraph，编排 6 阶段工作流 |
| `workflow/nodes.py` | 各工作流节点的具体逻辑实现 |
| `workflow/state.py` | 工作流状态定义 (TypedDict / Pydantic) |
| `tools/poi_tools.py` | POI 搜索工具 (对接 POI Service) |
| `tools/weather_tools.py` | 天气查询工具 |
| `tools/budget_tools.py` | 预算计算工具 |
| `tools/schedule_tools.py` | 排程验证工具 |
| `prompts/planner.py` | Planner 节点提示词 |
| `prompts/detailer.py` | Detail 节点提示词 |
| `prompts/optimizer.py` | Optimize 节点提示词 |
| `prompts/system.py` | 系统级提示词 |

#### 3.2.2 核心服务 (`core/`)

| 子模块 | 职责 |
|--------|------|
| `itinerary/service.py` | 行程 CRUD + 生成请求调度 |
| `poi/service.py` | POI 检索、分类筛选、排序 |
| `budget/service.py` | 预算分配计算、合理性校验 |
| `scheduler/engine.py` | 时间感知排程：地理聚类 + 时段分配 |

#### 3.2.3 基础设施服务 (`services/`)

| 子模块 | 职责 |
|--------|------|
| `llm/client.py` | LangChain ChatAnthropic 客户端封装 |
| `cache/redis.py` | Redis 连接池 + 缓存装饰器 |
| `queue/kafka.py` | Kafka 生产者/消费者封装 |
| `external/amap.py` | 高德地图 API 客户端 (地理编码/距离矩阵) |
| `external/weather.py` | 和风天气 API 客户端 |

---

## 4. 数据模型

### 4.1 ER 图（文字描述）

```
┌───────────┐     ┌───────────┐     ┌───────────────┐
│   users   │     │  cities   │     │     pois       │
├───────────┤     ├───────────┤     ├───────────────┤
│ id (PK)   │     │ id (PK)   │     │ id (PK)       │
│ nickname  │     │ name      │────>│ city_id (FK)  │
│ email     │     │ name_en   │     │ name          │
│ avatar    │     │ country   │     │ category      │
│ phone     │     │ province  │     │ sub_category  │
│ preferenc │     │ latitude  │     │ address       │
│ status    │     │ longitude │     │ latitude      │
│ created_at│     │ timezone  │     │ longitude     │
│ updated_at│     │ desc      │     │ rating        │
└─────┬─────┘     │ status    │     │ price_level   │
      │           │ created_at│     │ opening_hours │
      │           └───────────┘     │ visit_duration│
      │                             │ description   │
      │                             │ image_url     │
      │                             │ status        │
      │                             │ created_at    │
      │                             │ updated_at    │
      │                             └───────────────┘
      │
      │  ┌─────────────────────────────────────┐
      │  │           itineraries               │
      │  ├─────────────────────────────────────┤
      ├──│ user_id (FK)                        │
      │  │ id (PK)                             │
      │  │ title                               │
      │  │ destinations (JSON)                 │
      │  │ start_date                          │
      │  │ end_date                            │
      │  │ total_budget                        │
      │  │ budget_breakdown (JSON)             │
      │  │ preferences (JSON)                  │
      │  │ status (draft/confirmed/completed)  │
      │  │ raw_plan (TEXT)                     │
      │  │ created_at                          │
      │  │ updated_at                          │
      └──┼─────────────────────────────────────┘
         │
         │  ┌─────────────────────────────────────┐
         │  │          itinerary_days              │
         │  ├─────────────────────────────────────┤
         └──│ itinerary_id (FK)                   │
            │ id (PK)                             │
            │ day_number                          │
            │ date                                │
            │ weather_forecast (JSON)             │
            │ notes                               │
            │ created_at                          │
            └─────────────────────────────────────┘
                      │
                      │  ┌─────────────────────────────────────┐
                      │  │         itinerary_slots              │
                      │  ├─────────────────────────────────────┤
                      └──│ day_id (FK)                         │
                         │ id (PK)                             │
                         │ slot_type (morning/afternoon/evening│
                         │ poi_id                              │
                         │ poi_name                            │
                         │ poi_category                        │
                         │ address                             │
                         │ latitude                            │
                         │ longitude                           │
                         │ start_time                          │
                         │ end_time                            │
                         │ duration (minutes)                  │
                         │ transport_tip                       │
                         │ cost                                │
                         │ note                                │
                         │ sort_order                          │
                         │ created_at                          │
                         └─────────────────────────────────────┘

┌───────────────┐
│   feedback    │
├───────────────┤
│ id (PK)       │
│ itinerary_id  │
│ user_id (FK)  │
│ rating (1-5)  │
│ content       │
│ created_at    │
└───────────────┘
```

### 4.2 表结构 DDL

#### 用户表 `users`

```sql
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nickname    VARCHAR(64)     NOT NULL DEFAULT '',
    avatar      VARCHAR(512)    NOT NULL DEFAULT '',
    email       VARCHAR(128)    NOT NULL DEFAULT '' UNIQUE,
    phone       VARCHAR(20)     NOT NULL DEFAULT '',
    preferences JSON            COMMENT '用户偏好: {food_types:[], interests:[], budget_level:""}',
    status      TINYINT         NOT NULL DEFAULT 1 COMMENT '0-禁用 1-正常',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 城市表 `cities`

```sql
CREATE TABLE cities (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(64)     NOT NULL COMMENT '中文名',
    name_en     VARCHAR(128)    NOT NULL DEFAULT '',
    country     VARCHAR(64)     NOT NULL DEFAULT '中国',
    province    VARCHAR(64)     NOT NULL DEFAULT '',
    latitude    DECIMAL(10,7)   NOT NULL DEFAULT 0,
    longitude   DECIMAL(10,7)   NOT NULL DEFAULT 0,
    timezone    VARCHAR(32)     NOT NULL DEFAULT 'Asia/Shanghai',
    description TEXT,
    status      TINYINT         NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### POI 表 `pois`

```sql
CREATE TABLE pois (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_id         BIGINT          NOT NULL,
    name            VARCHAR(256)    NOT NULL,
    category        VARCHAR(32)     NOT NULL COMMENT 'attraction/restaurant/hotel/shopping/entertainment',
    sub_category    VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '如: 博物馆/川菜/民宿',
    address         VARCHAR(512)    NOT NULL DEFAULT '',
    latitude        DECIMAL(10,7)   NOT NULL DEFAULT 0,
    longitude       DECIMAL(10,7)   NOT NULL DEFAULT 0,
    rating          DECIMAL(2,1)    NOT NULL DEFAULT 0 COMMENT '评分 1.0-5.0',
    price_level     TINYINT         NOT NULL DEFAULT 1 COMMENT '1-便宜 2-中等 3-昂贵',
    opening_hours   VARCHAR(256)    NOT NULL DEFAULT '' COMMENT '营业时间描述',
    visit_duration  INT             NOT NULL DEFAULT 120 COMMENT '建议游览时长(分钟)',
    description     TEXT,
    image_url       VARCHAR(512)    NOT NULL DEFAULT '',
    status          TINYINT         NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city_id),
    INDEX idx_category (category),
    INDEX idx_city_cat (city_id, category),
    INDEX idx_rating (rating DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 行程表 `itineraries`

```sql
CREATE TABLE itineraries (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT          NOT NULL,
    title             VARCHAR(256)    NOT NULL DEFAULT '',
    destinations      JSON            NOT NULL COMMENT '[{city_id, city_name, days}]',
    start_date        DATE            DEFAULT NULL,
    end_date          DATE            DEFAULT NULL,
    total_budget      DECIMAL(12,2)   DEFAULT NULL COMMENT '总预算(元)',
    budget_breakdown  JSON            COMMENT '预算分配: {transport, hotel, food, tickets, other}',
    preferences       JSON            COMMENT '用户偏好快照',
    status            ENUM('draft','confirmed','completed','cancelled') NOT NULL DEFAULT 'draft',
    raw_plan          LONGTEXT        COMMENT 'Agent 生成的原始行程文本',
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 行程日期表 `itinerary_days`

```sql
CREATE TABLE itinerary_days (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id      BIGINT          NOT NULL,
    day_number        INT             NOT NULL COMMENT '第几天(从1开始)',
    date              DATE            DEFAULT NULL,
    weather_forecast  JSON            COMMENT '{weather, temp_min, temp_max, humidity}',
    notes             TEXT,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_itinerary (itinerary_id),
    INDEX idx_day_num (itinerary_id, day_number),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 行程时段表 `itinerary_slots`

```sql
CREATE TABLE itinerary_slots (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    day_id            BIGINT          NOT NULL,
    slot_type         ENUM('morning','afternoon','evening') NOT NULL,
    poi_id            BIGINT          DEFAULT NULL COMMENT '关联POI(可选)',
    poi_name          VARCHAR(256)    NOT NULL,
    poi_category      VARCHAR(32)     NOT NULL DEFAULT '',
    address           VARCHAR(512)    NOT NULL DEFAULT '',
    latitude          DECIMAL(10,7)   DEFAULT NULL,
    longitude         DECIMAL(10,7)   DEFAULT NULL,
    start_time        VARCHAR(16)     NOT NULL DEFAULT '' COMMENT '如 09:00',
    end_time          VARCHAR(16)     NOT NULL DEFAULT '' COMMENT '如 12:00',
    duration          INT             NOT NULL DEFAULT 120 COMMENT '时长(分钟)',
    transport_tip     VARCHAR(512)    NOT NULL DEFAULT '' COMMENT '交通建议',
    cost              DECIMAL(10,2)   DEFAULT NULL,
    note              TEXT,
    sort_order        INT             NOT NULL DEFAULT 0,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_day (day_id),
    INDEX idx_day_order (day_id, sort_order),
    FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 反馈表 `feedback`

```sql
CREATE TABLE feedback (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id    BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    rating          TINYINT         NOT NULL COMMENT '1-5 星',
    content         TEXT,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_itinerary (itinerary_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 Pydantic 模型定义

```python
# models/schemas.py

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date, datetime

class Destination(BaseModel):
    city_id: int
    city_name: str
    days: int = 1

class Preference(BaseModel):
    food_types: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    budget_level: Literal["economy", "moderate", "luxury"] = "moderate"
    pace: Literal["relaxed", "normal", "intensive"] = "normal"

class ItineraryGenerateRequest(BaseModel):
    """行程生成请求"""
    user_id: Optional[int] = None
    destinations: list[Destination] = Field(min_length=1, max_length=5)
    start_date: Optional[date] = None
    preferences: Preference = Field(default_factory=Preference)
    total_budget: Optional[float] = None

class ItinerarySlotCreate(BaseModel):
    slot_type: Literal["morning", "afternoon", "evening"]
    poi_id: Optional[int] = None
    poi_name: str
    poi_category: str = ""
    address: str = ""
    start_time: str = ""
    end_time: str = ""
    duration: int = 120
    transport_tip: str = ""
    cost: Optional[float] = None
    note: str = ""
    sort_order: int = 0

class ItineraryDayCreate(BaseModel):
    day_number: int
    date: Optional[date] = None
    notes: str = ""
    slots: list[ItinerarySlotCreate] = Field(default_factory=list)

class ItineraryCreate(BaseModel):
    user_id: Optional[int] = None
    title: str = ""
    destinations: list[Destination]
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_budget: Optional[float] = None
    budget_breakdown: Optional[dict] = None
    preferences: Preference = Field(default_factory=Preference)
    days: list[ItineraryDayCreate] = Field(default_factory=list)

class ItineraryRefineRequest(BaseModel):
    """行程精调请求"""
    itinerary_id: int
    feedback: str = Field(..., description="用户对当前行程的修改意见")
```

---

## 5. API 设计

### 5.1 基础信息

- 基础路径: `/api/v1`
- 协议: JSON over HTTP
- 认证: Bearer Token (Header)
- 分页: `?page=1&size=20`
- 响应格式:

```json
{
    "code": 0,
    "message": "success",
    "data": {},
    "trace_id": "xxx"
}
```

### 5.2 API 端点列表

#### 行程管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/itineraries/generate` | **异步** 提交行程生成请求 |
| GET | `/api/v1/itineraries/generate/{task_id}/status` | 查询生成任务状态 |
| GET | `/api/v1/itineraries` | 获取行程列表 |
| GET | `/api/v1/itineraries/{id}` | 获取行程详情 (含天数+时段) |
| PUT | `/api/v1/itineraries/{id}` | 更新行程 |
| DELETE | `/api/v1/itineraries/{id}` | 删除行程 |
| POST | `/api/v1/itineraries/{id}/refine` | **异步** 提交精调请求 |
| POST | `/api/v1/itineraries/{id}/confirm` | 确认行程 |

#### POI 检索

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/pois` | 按城市/分类/关键字检索 POI |
| GET | `/api/v1/pois/{id}` | POI 详情 |
| GET | `/api/v1/pois/categories` | 获取 POI 分类列表 |

#### 城市

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/cities` | 城市列表/搜索 |
| GET | `/api/v1/cities/{id}` | 城市详情 |

#### 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/users` | 创建用户 |
| GET | `/api/v1/users/{id}` | 获取用户信息 |
| PUT | `/api/v1/users/{id}` | 更新用户偏好 |

#### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/health` | 服务健康检查 (含各中间件状态) |

### 5.3 核心接口详细定义

#### POST `/api/v1/itineraries/generate` — 提交行程生成

**Request:**
```json
{
    "user_id": 1,
    "destinations": [
        {"city_id": 1, "city_name": "成都", "days": 3}
    ],
    "start_date": "2026-06-01",
    "preferences": {
        "food_types": ["川菜", "火锅"],
        "interests": ["历史", "自然", "美食"],
        "budget_level": "moderate",
        "pace": "normal"
    },
    "total_budget": 5000
}
```

**Response (202 Accepted):**
```json
{
    "code": 0,
    "message": "accepted",
    "data": {
        "task_id": "gen_abc123",
        "status": "pending",
        "estimated_seconds": 20
    }
}
```

#### GET `/api/v1/itineraries/generate/{task_id}/status` — 查询任务状态

**Response:**
```json
{
    "code": 0,
    "data": {
        "task_id": "gen_abc123",
        "status": "processing",
        "progress": 0.6,
        "current_stage": "detail",
        "itinerary_id": null
    }
}
```

**最终状态 (status=completed):**
```json
{
    "code": 0,
    "data": {
        "task_id": "gen_abc123",
        "status": "completed",
        "progress": 1.0,
        "itinerary_id": 42
    }
}
```

#### GET `/api/v1/itineraries/{id}` — 行程详情

**Response:**
```json
{
    "code": 0,
    "data": {
        "id": 42,
        "title": "成都 3 日深度游",
        "destinations": [{"city_id": 1, "city_name": "成都", "days": 3}],
        "total_budget": 5000,
        "budget_breakdown": {
            "transport": 800,
            "hotel": 1800,
            "food": 1200,
            "tickets": 700,
            "other": 500
        },
        "status": "draft",
        "days": [
            {
                "day_number": 1,
                "date": "2026-06-01",
                "weather_forecast": {"weather": "晴", "temp_min": 22, "temp_max": 30},
                "notes": "抵达成都，感受蓉城魅力",
                "slots": [
                    {
                        "slot_type": "morning",
                        "poi_name": "成都大熊猫繁育研究基地",
                        "poi_category": "attraction",
                        "start_time": "08:00",
                        "end_time": "11:30",
                        "duration": 210,
                        "transport_tip": "地铁3号线熊猫大道站换乘景区直通车",
                        "cost": 55,
                        "sort_order": 0
                    },
                    {
                        "slot_type": "afternoon",
                        "poi_name": "武侯祠",
                        "poi_category": "attraction",
                        "start_time": "13:00",
                        "end_time": "15:00",
                        "duration": 120,
                        "cost": 50,
                        "sort_order": 1
                    },
                    {
                        "slot_type": "afternoon",
                        "poi_name": "锦里古街",
                        "poi_category": "shopping",
                        "start_time": "15:00",
                        "end_time": "17:00",
                        "duration": 120,
                        "cost": 0,
                        "sort_order": 2
                    },
                    {
                        "slot_type": "evening",
                        "poi_name": "小龙坎老火锅",
                        "poi_category": "restaurant",
                        "start_time": "18:00",
                        "end_time": "19:30",
                        "duration": 90,
                        "cost": 150,
                        "sort_order": 3
                    }
                ]
            }
        ]
    }
}
```

#### POST `/api/v1/itineraries/{id}/refine` — 精调行程

**Request:**
```json
{
    "itinerary_id": 42,
    "feedback": "第一天太赶了，去掉一个景点，第二天增加一个博物馆"
}
```

**Response (202 Accepted):**
```json
{
    "code": 0,
    "message": "accepted",
    "data": {
        "task_id": "ref_xyz456",
        "status": "pending"
    }
}
```

---

## 6. Agent 工作流设计

### 6.1 LangGraph StateGraph 定义

工作流采用 LangGraph 的 `StateGraph`，状态 (`AgentState`) 在各节点间传递。

```python
class AgentState(TypedDict):
    # 用户输入
    request: ItineraryGenerateRequest
    # 研究阶段结果
    city_info: dict              # 城市基础信息
    pois: dict[str, list]        # 按分类的POI列表 {category: [POI]}
    weather: dict[str, dict]     # 每日天气 {day_number: {weather, temp}}
    # 规划阶段
    day_plan: list               # 每日框架 [{day_number, theme, focus}]
    # 详细排程
    detailed_slots: list         # 排程结果
    # 预算
    budget_breakdown: dict       # 预算分配
    # 优化校验
    validation_issues: list      # 校验问题列表
    refine_round: int            # 精调轮次
    max_refine_rounds: int       # 最大精调轮次
    # 输出
    output: dict                 # 最终结构化行程
    # 运行状态
    error: Optional[str]
```

### 6.2 节点定义

#### Node 1: GatherInfo

```
输入: 用户请求 (destinations, days, preferences, budget)
处理:
  - 解析和校验用户输入
  - 计算行程总天数
  - 生成行程标题
  - 初始化 AgentState
输出: 填充后的 AgentState
工具调用: 无
LLM调用: 是 (生成标题、补充默认偏好)
```

#### Node 2: Research

```
输入: AgentState (request)
处理:
  - 并行调用多个工具收集信息
  - 城市信息查询
  - 按用户兴趣分类检索 POI
  - 每日天气查询
输出: AgentState (city_info, pois, weather)
工具调用:
  - get_city_info(city_id) -> CityInfo
  - search_pois(city_id, category, limit) -> List[POI]
  - get_weather(city, date) -> WeatherInfo
LLM调用: 否 (纯工具调用)
```

#### Node 3: Plan

```
输入: AgentState (city_info, pois, weather, request)
处理:
  - LLM 基于获取的信息制定每日主题
  - 每天分配一个核心主题/区域
  - 初步分配 POI 到各天（粗粒度）
  - 考虑地理聚类减少交通时间
输出: AgentState (day_plan)
工具调用: 无
LLM调用: 是 (核心规划推理)
```

#### Node 4: Detail

```
输入: AgentState (day_plan, pois)
处理:
  - 每天细分为 morning / afternoon / evening 三个时段
  - 为每个时段分配具体 POI
  - 计算时段起止时间
  - 添加交通建议
  - 添加餐饮推荐（午餐/晚餐）
输出: AgentState (detailed_slots)
工具调用: 
  - get_distance(origin, dest) -> distance (可选)
LLM调用: 是 (详细排程推理)
```

#### Node 5: Optimize

```
输入: AgentState (detailed_slots, budget_breakdown)
处理:
  - 时间合理性检查（是否太赶/太空）
  - 预算分配校验
  - 地理路径优化
  - 发现冲突/问题记录到 validation_issues
  - 如有问题，根据问题类型决定是否回到 Plan 或 Detail
条件边:
  - 有问题且 refine_round < max_refine_rounds → Plan 或 Detail
  - 无问题或达到最大轮次 → Present
工具调用:
  - calculate_budget(slots) -> BudgetBreakdown
LLM调用: 是 (合理性分析和优化建议)
```

#### Node 6: Present

```
输入: AgentState (所有数据)
处理:
  - 将结构化数据组装为最终输出格式
  - 生成人类可读的行程摘要
  - 持久化到 MySQL
  - 发送 Kafka 结果消息
输出: AgentState (output)
工具调用: 无 (数据组装)
LLM调用: 是 (生成行程摘要文本)
```

### 6.3 Workflow 路由逻辑

```python
# 条件边判断

def should_refine(state: AgentState) -> Literal["plan", "detail", "present"]:
    """根据校验结果决定下一步"""
    if not state.get("validation_issues") or state["refine_round"] >= state["max_refine_rounds"]:
        return "present"
    # 框架性问题回 Plan，细节性问题回 Detail
    has_framework_issues = any(
        i["level"] == "framework" for i in state["validation_issues"]
    )
    return "plan" if has_framework_issues else "detail"
```

### 6.4 Tool 定义

#### `get_city_info`

```python
@tool
def get_city_info(city_name: str) -> dict:
    """获取城市基础信息和简介"""
    # 从 MySQL/缓存查询
    return {
        "city_id": 1,
        "name": "成都",
        "name_en": "Chengdu",
        "description": "...",
        "latitude": 30.5728,
        "longitude": 104.0668,
        "famous_for": ["大熊猫", "火锅", "川剧"],
        "best_season": ["春季", "秋季"],
        "avg_stay_days": 3
    }
```

#### `search_pois`

```python
@tool
def search_pois(
    city_name: str,
    categories: Optional[list[str]] = None,
    keywords: Optional[list[str]] = None,
    limit: int = 10
) -> list[dict]:
    """根据城市和分类检索景点/餐厅/酒店等POI"""
    # 从 MySQL 查询，支持 Redis 缓存
    return [...]
```

#### `get_weather`

```python
@tool
def get_weather(city_name: str, date: str) -> dict:
    """查询指定城市在指定日期的天气预报"""
    # 调用和风天气 API
    return {
        "weather": "晴",
        "temp_min": 22,
        "temp_max": 30,
        "humidity": 60,
        "wind": "东风2级",
        "tips": "适合户外活动"
    }
```

#### `calculate_budget`

```python
@tool
def calculate_budget(
    total: float,
    transport_ratio: float = 0.2,
    hotel_ratio: float = 0.35,
    food_ratio: float = 0.25,
    tickets_ratio: float = 0.15,
    other_ratio: float = 0.05
) -> dict:
    """根据总预算和分配比例计算各项目预算"""
    return {"transport": ..., "hotel": ..., "food": ..., "tickets": ..., "other": ...}
```

---

## 7. 消息与缓存设计

### 7.1 Kafka 主题定义

| Topic | 分区数 | 保留时间 | 说明 |
|-------|--------|----------|------|
| `itinerary-generation-requests` | 3 | 7d | 行程生成请求 |
| `itinerary-generation-results` | 3 | 7d | 生成结果通知 |
| `itinerary-refine-requests` | 3 | 7d | 精调请求 |
| `poi-sync-requests` | 2 | 3d | POI 数据同步 |
| `notification-events` | 2 | 1d | 通知事件 |

#### 消息体格式

```json
// itinerary-generation-requests
{
    "event_id": "evt_xxx",
    "version": "1.0",
    "timestamp": "2026-05-16T10:00:00Z",
    "type": "itinerary.generate",
    "payload": {
        "task_id": "gen_abc123",
        "request": { ... },  // ItineraryGenerateRequest
        "user_id": 1
    }
}

// itinerary-generation-results
{
    "event_id": "evt_yyy",
    "version": "1.0",
    "timestamp": "2026-05-16T10:00:30Z",
    "type": "itinerary.generated",
    "payload": {
        "task_id": "gen_abc123",
        "itinerary_id": 42,
        "status": "completed",
        "duration_seconds": 28.5
    }
}
```

### 7.2 消息流

```
客户端                       API服务                    Agent Worker                   MySQL/Redis
  │                           │                           │                              │
  │  POST /generate           │                           │                              │
  │ ──────────────────────►   │                           │                              │
  │                           │  validate & store task    │                              │
  │                           │ ────────────────────────► │                              │
  │  202 {task_id, status}    │                           │                              │
  │ ◄────────────────────────  │                           │                              │
  │                           │                           │                              │
  │  (客户端轮询中...)         │                           │                              │
  │                           │                           │                              │
  │                           │   Kafka: generate req     │                              │
  │                           │ ────────────────────────► │                              │
  │                           │                           │  LangGraph Agent Run         │
  │                           │                           │  ├─ GatherInfo               │
  │                           │                           │  ├─ Research ──────► 查询POI  │
  │                           │                           │  ├─ Plan ────────►  LLM推理   │
  │                           │                           │  ├─ Detail ──────►  排程      │
  │                           │                           │  ├─ Optimize ────►  校验      │
  │                           │                           │  └─ Present ────►  持久化    │
  │                           │                           │     │           ────────►    │
  │                           │                           │     │                        │
  │                           │  Kafka: generation result │     │                        │
  │                           │ ◄─────────────────────────│     │                        │
  │                           │                           │                              │
  │  GET /generate/status     │                           │                              │
  │ ────────────────────────► │  Redis / DB 查询状态      │                              │
  │ ◄─────────────────────────│                           │                              │
  │  {status: completed, id}  │                           │                              │
  │                           │                           │                              │
```

### 7.3 Redis 缓存策略

| Key 模式 | 存储内容 | TTL | 失效策略 |
|----------|---------|-----|---------|
| `task:{task_id}` | 生成任务状态 (JSON) | 30min | 任务完成后延迟过期 |
| `task:{task_id}:progress` | 任务进度信息 | 30min | 任务完成后延迟过期 |
| `city:{city_id}` | 城市基本信息 | 24h | 城市数据更新时主动失效 |
| `poi:city:{city_id}:cat:{category}` | POI 列表 | 1h | POI 数据更新时主动失效 |
| `poi:search:{query_hash}` | 搜索结果缓存 | 30min | 定期失效 |
| `weather:{city_name}:{date}` | 天气预报 | 2h | 定期失效 |
| `rate_limit:{ip}` | 接口限流计数 | 1s/1m/1h | 根据限流窗口 |

### 7.4 Kafka 消费者配置

```
Consumer Group: itinerary-agent-group
  - itinerary-generation-requests  (concurrency=3)
  - itinerary-refine-requests      (concurrency=2)

Consumer Group: poi-sync-group
  - poi-sync-requests               (concurrency=1)
```

---

## 8. 错误处理与日志

### 8.1 错误分类与响应码

| HTTP 状态码 | 业务错误码 | 说明 |
|-------------|-----------|------|
| 400 | 40000 | 参数校验失败 |
| 400 | 40001 | 目的地不支持 |
| 400 | 40002 | 预算不合理 |
| 404 | 40400 | 资源不存在 |
| 409 | 40900 | 行程正在生成中 |
| 422 | 42200 | LLM 输出解析失败 |
| 429 | 42900 | 请求过于频繁 |
| 500 | 50000 | 服务内部错误 |
| 502 | 50200 | LLM API 调用失败 |
| 503 | 50300 | 中间件连接失败 |

### 8.2 Agent 错误处理

| 错误场景 | 处理策略 |
|---------|---------|
| LLM API 超时 | 重试 3 次，每次间隔 2s |
| LLM 返回格式异常 | 重新解析，失败则回退到 Detail 节点重试 |
| 外部 API 不可用 | 跳过该工具调用，使用缓存/默认值替代 |
| POI 数据不足 | Agent 自动降低筛选条件扩大召回 |
| 预算无法覆盖 | Agent 调整分配比例并通知用户 |

### 8.3 日志规范

```python
# 日志格式
{
    "timestamp": "2026-05-16T10:00:00.123Z",
    "level": "INFO",
    "service": "travel-planner",
    "module": "agent.workflow.nodes",
    "trace_id": "trace_xxx",
    "span_id": "span_yyy",
    "message": "Research node completed",
    "extra": {
        "city": "成都",
        "poi_count": 45,
        "duration_ms": 3200
    }
}
```

### 8.4 关键监控指标

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `agent.task.total` | Counter | 任务总数 |
| `agent.task.duration` | Histogram | 任务耗时分布 |
| `agent.llm.calls` | Counter | LLM 调用次数 |
| `agent.llm.tokens` | Counter | Token 消耗 |
| `agent.tool.calls` | Counter | 工具调用次数 |
| `agent.node.duration` | Histogram | 各节点耗时 |
| `api.request.duration` | Histogram | API 响应时间 |
| `api.request.total` | Counter | API 请求总数 |
| `cache.hit_ratio` | Gauge | 缓存命中率 |
| `queue.lag` | Gauge | Kafka 消费堆积 |

---

## 9. 安全设计

### 9.1 API 安全

- **认证**: Bearer Token，Token 在 Redis 中维护
- **限流**: 基于 Redis 的滑动窗口限流，按 IP/Token 分别控制
- **参数校验**: Pydantic 严格校验输入参数，防止注入
- **CORS**: 配置白名单域名

### 9.2 数据安全

- **敏感字段**: 用户手机号等敏感字段加密存储
- **SQL 注入防护**: 使用 SQLAlchemy ORM，禁止原生 SQL 拼接
- **LLM Prompt 安全**: Agent 提示词中明确指令边界，防止 Prompt 注入

### 9.3 中间件安全

- **Redis**: 设置访问密码，绑定内网 IP
- **Kafka**: 开启 SASL/PLAIN 认证
- **MySQL**: 最小权限原则，不同服务使用不同账号

---

## 10. 测试策略

### 10.1 测试层级

| 层级 | 范围 | 工具 | 覆盖目标 |
|------|------|------|---------|
| 单元测试 | Models / Utils / Services | pytest | ≥ 80% |
| 集成测试 | API Endpoints / Agent Nodes | pytest + httpx | 核心路径 100% |
| Agent 测试 | LangGraph Workflow | pytest + mock LLM | 各节点路由逻辑 |
| E2E 测试 | 完整生成流程 | pytest + 真实 LLM(可选) | 端到端验证 |

### 10.2 测试场景

```
单元测试:
  - POI 检索过滤逻辑
  - 预算分配计算
  - 数据模型序列化/反序列化
  - 状态机节点路由条件

集成测试:
  - POST /itineraries/generate → 202
  - GET /itineraries/generate/{task_id}/status → 200
  - GET /itineraries/{id} → 200 / 404
  - POST /itineraries/{id}/refine → 202
  - Redis 缓存穿透回源
  - Kafka 消息发送与消费

Agent 测试:
  - Research 节点: mock LLM + 真实工具
  - Plan 节点: 真实 LLM + mock 工具
  - Optimize → 回流 Detail
  - 达到最大精调轮次 → Present
```

---

## 11. 部署架构

### 11.1 Docker Compose (开发环境)

```yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [mysql, redis, kafka]
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092

  agent-worker:
    build: .
    command: python -m agent.worker
    depends_on: [mysql, redis, kafka, api]

  mysql:
    image: mysql:8.0
    volumes: [./data/mysql:/var/lib/mysql]

  redis:
    image: redis:7-alpine

  kafka:
    image: confluentinc/cp-kafka:7.5
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5
```

### 11.2 生产部署 (Kubernetes)

```
                    ┌──────────────┐
                    │   Nginx      │
                    │   Ingress    │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────┴──────┐          ┌───────┴──────┐
        │  API       │          │  Agent       │
        │  (HPA x3)  │          │  Worker (x2) │
        └─────┬──────┘          └───────┬──────┘
              │                         │
        ┌─────┴──────┐          ┌───────┴──────┐
        │  Redis     │          │  Kafka       │
        │  Sentinel  │          │  Cluster x3  │
        └────────────┘          └──────────────┘
              │                         │
        ┌─────┴─────────────────────────┴──────┐
        │           MySQL                      │
        │           (主从 + Proxy)             │
        └──────────────────────────────────────┘
```

---

## 12. 开发路线图

### 里程碑 M1: 核心骨架 (Week 1)

**目标**: 项目结构搭建 + 数据模型 + 基础 API

| 任务 | 产出 |
|------|------|
| 项目结构初始化 | 完整的目录结构 |
| 配置管理 | config.py + .env |
| 数据模型定义 | SQLAlchemy models + Pydantic schemas |
| 数据库初始化 | 初始化脚本 + 种子数据 (5城市) |
| CRUD API | itineraries / pois / cities CRUD |
| Docker Compose | 开发环境一键启动 |

### 里程碑 M2: Agent 引擎 (Week 2)

**目标**: LangGraph 工作流跑通，可生成简单行程

| 任务 | 产出 |
|------|------|
| LLM 客户端封装 | ChatAnthropic 集成 |
| Tool 定义 | 4 个核心工具 |
| LangGraph StateGraph 定义 | 6 节点工作流 |
| Agent Worker | Kafka 消费者 + Agent 执行器 |
| 异步任务 API | generate/status/refine 接口 |
| 提示词模板 | 各节点 System Prompt |

### 里程碑 M3: 系统增强 (Week 3)

**目标**: 缓存 + 消息队列 + 外部 API 集成

| 任务 | 产出 |
|------|------|
| Redis 缓存接入 | 缓存装饰器 + 缓存策略实现 |
| Kafka 生产/消费 | 完整消息流转 |
| 外部 API 集成 | 高德地图 + 和风天气 |
| 行程精调流程 | Refine 循环 |
| 错误处理 | 全局异常处理 + 重试机制 |

### 里程碑 M4: 测试与优化 (Week 4)

**目标**: 全面测试 + 文档 + 性能调优

| 任务 | 产出 |
|------|------|
| 单元测试 | 覆盖核心模块 |
| 集成测试 | API + Agent 工作流 |
| 性能优化 | LLM Token 优化 + 缓存预热 |
| API 文档 | Swagger 完善 |
| 部署文档 | Docker Compose + K8s 配置 |

---

> **文档版本记录**
>
> | 版本 | 日期 | 修改内容 | 作者 |
> |------|------|---------|------|
> | v1.0 | 2026-05-16 | 初始完整设计 | - |
