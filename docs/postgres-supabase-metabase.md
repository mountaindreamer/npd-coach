# Postgres + 可视化（Supabase / Metabase）上线说明

## 1) 在 Supabase 创建数据库并拿连接串

1. 新建 Supabase Project。
2. 进入 `Project Settings -> Database`，复制连接串（Connection string）。
3. 写入部署环境变量：

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
```

> 未配置 `DATABASE_URL` 时，系统会自动回退到本地 `server-data/*.json`。

## 2) 初始化表结构

在 Supabase SQL Editor 里执行 `docs/sql/init-postgres.sql`。

## 3) 部署后检查

触发一次完整链路：

- 首页打开（写 `events`）
- 进入聊天并发送消息（写 `sessions/events`）
- 结束训练（写 `sessions/messages`，同意授权时会落 `messages`）
- UGC 提交与审核（写 `ugc`）

## 4) Metabase 连接

1. 新建 Metabase -> Add database -> PostgreSQL。
2. 使用同一 `DATABASE_URL` 参数连接。
3. 导入后建立 Dashboard。

推荐看板（MVP）：

- 首页曝光到开聊漏斗
- 每日会话数 + 完成率
- 平均反馈分趋势
- 场景点击 Top10
- UGC 审核通过率与积压量

## 5) 常用 SQL（可直接贴 Metabase）

### A. 每日会话与完成率

```sql
select
  date_trunc('day', created_at) as day,
  count(*) as sessions,
  count(*) filter (where ended_at is not null) as ended_sessions,
  round(
    (count(*) filter (where ended_at is not null)::numeric / nullif(count(*),0)) * 100,
    2
  ) as end_rate_pct
from sessions
group by 1
order by 1 desc;
```

### B. 埋点漏斗（首页 -> 点场景 -> 首条消息 -> 结束）

```sql
with base as (
  select
    user_id,
    bool_or(event = 'page_view_home') as viewed_home,
    bool_or(event = 'scenario_card_click') as clicked_scenario,
    bool_or(event = 'send_first_message') as sent_first_message,
    bool_or(event = 'session_end') as ended_session
  from events
  where created_at >= now() - interval '30 day'
  group by user_id
)
select
  count(*) filter (where viewed_home) as home_uv,
  count(*) filter (where viewed_home and clicked_scenario) as click_uv,
  count(*) filter (where viewed_home and clicked_scenario and sent_first_message) as first_msg_uv,
  count(*) filter (where viewed_home and clicked_scenario and sent_first_message and ended_session) as ended_uv
from base;
```

### C. 场景点击 Top10

```sql
select
  props ->> 'scenarioId' as scenario_id,
  count(*) as clicks
from events
where event = 'scenario_card_click'
group by 1
order by clicks desc
limit 10;
```

### D. UGC 审核状态分布

```sql
select status, count(*) as total
from ugc
group by status
order by total desc;
```

