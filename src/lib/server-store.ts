import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { RelationshipType, UGCScenario, UGCStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), "server-data");
const DATABASE_URL = process.env.DATABASE_URL;
const FORCE_FILE_STORE = process.env.STORE_MODE === "file";

type StoreFile =
  | "users"
  | "sessions"
  | "messages"
  | "events"
  | "ugc";

interface BaseEntity {
  id: string;
  createdAt: string;
}

export interface ServerUser extends BaseEntity {
  consentDialogueCollection: boolean;
  channel?: string;
}

export interface ServerSession extends BaseEntity {
  userId: string;
  mode: "simulation" | "coach";
  scenarioId?: string;
  difficulty?: string;
  endedAt?: string;
  durationSec?: number;
  messageCount?: number;
  feedbackSummary?: {
    overallScore?: number;
    boundaryScore?: number;
    emotionalRegulation?: number;
    strategyEffectiveness?: number;
  };
}

export interface ServerMessage extends BaseEntity {
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
}

export interface EventRecord extends BaseEntity {
  userId?: string;
  sessionId?: string;
  event: string;
  props?: Record<string, unknown>;
}

export interface ServerUGCScenario extends UGCScenario {
  userId: string;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface OpsSummary {
  generatedAt: string;
  windowDays: number;
  totals: {
    users: number;
    sessions: number;
    endedSessions: number;
    endRatePct: number;
    messages: number;
    events: number;
    ugcPending: number;
    ugcApproved: number;
    ugcRejected: number;
  };
  funnel: {
    homeUv: number;
    clickUv: number;
    firstMsgUv: number;
    endedUv: number;
  };
  topScenarios: Array<{ scenarioId: string; clicks: number }>;
  dailySessions: Array<{ day: string; sessions: number; endedSessions: number }>;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const hasPg = !!DATABASE_URL && !FORCE_FILE_STORE;
let pool: Pool | null = null;
let pgReady = false;

function getPool(): Pool {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required for postgres mode");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("localhost")
        ? false
        : {
            rejectUnauthorized: false,
          },
    });
  }
  return pool;
}

async function ensurePgSchema(): Promise<void> {
  if (!hasPg || pgReady) return;
  const p = getPool();
  await p.query(`
    create table if not exists users (
      id text primary key,
      created_at timestamptz not null default now(),
      consent_dialogue_collection boolean not null default false,
      channel text
    );

    create table if not exists sessions (
      id text primary key,
      created_at timestamptz not null default now(),
      user_id text not null references users(id),
      mode text not null,
      scenario_id text,
      difficulty text,
      ended_at timestamptz,
      duration_sec int,
      message_count int,
      feedback_summary jsonb
    );

    create table if not exists messages (
      id text primary key,
      created_at timestamptz not null default now(),
      session_id text not null references sessions(id),
      user_id text not null references users(id),
      role text not null,
      content text not null
    );

    create table if not exists events (
      id text primary key,
      created_at timestamptz not null default now(),
      user_id text references users(id),
      session_id text references sessions(id),
      event text not null,
      props jsonb
    );

    create table if not exists ugc (
      id text primary key,
      user_id text not null references users(id),
      title text not null,
      content text not null,
      relationship_type text not null,
      created_at timestamptz not null default now(),
      plays int not null default 0,
      status text not null default 'pending',
      review_note text,
      reviewed_at timestamptz,
      reviewed_by text
    );

    create index if not exists idx_events_created_at on events(created_at desc);
    create index if not exists idx_sessions_user on sessions(user_id, created_at desc);
    create index if not exists idx_messages_session on messages(session_id, created_at);
    create index if not exists idx_ugc_status on ugc(status, created_at desc);
  `);
  pgReady = true;
}

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function filePath(name: StoreFile): string {
  return path.join(DATA_DIR, `${name}.json`);
}

async function readList<T>(name: StoreFile): Promise<T[]> {
  await ensureDir();
  const fp = filePath(name);
  try {
    const raw = await readFile(fp, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeList<T>(name: StoreFile, list: T[]): Promise<void> {
  await ensureDir();
  const fp = filePath(name);
  await writeFile(fp, JSON.stringify(list, null, 2), "utf8");
}

export async function upsertUser(input: {
  id: string;
  consentDialogueCollection?: boolean;
  channel?: string;
}): Promise<ServerUser> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const { rows } = await p.query<{
      id: string;
      created_at: string;
      consent_dialogue_collection: boolean;
      channel: string | null;
    }>(
      `
      insert into users(id, consent_dialogue_collection, channel)
      values ($1, coalesce($2, false), $3)
      on conflict(id) do update set
        consent_dialogue_collection = coalesce(excluded.consent_dialogue_collection, users.consent_dialogue_collection),
        channel = coalesce(excluded.channel, users.channel)
      returning id, created_at, consent_dialogue_collection, channel
      `,
      [input.id, input.consentDialogueCollection, input.channel ?? null]
    );
    const row = rows[0];
    return {
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      consentDialogueCollection: row.consent_dialogue_collection,
      channel: row.channel ?? undefined,
    };
  }

  const users = await readList<ServerUser>("users");
  const now = new Date().toISOString();
  const existing = users.find((u) => u.id === input.id);
  if (existing) {
    if (typeof input.consentDialogueCollection === "boolean") {
      existing.consentDialogueCollection = input.consentDialogueCollection;
    }
    existing.channel = input.channel ?? existing.channel;
    await writeList("users", users);
    return existing;
  }
  const user: ServerUser = {
    id: input.id,
    createdAt: now,
    consentDialogueCollection: !!input.consentDialogueCollection,
    channel: input.channel,
  };
  users.unshift(user);
  await writeList("users", users);
  return user;
}

export async function createSession(input: {
  userId: string;
  mode: "simulation" | "coach";
  scenarioId?: string;
  difficulty?: string;
}): Promise<ServerSession> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const id = uid("sess");
    const { rows } = await p.query<{
      id: string;
      created_at: string;
      user_id: string;
      mode: "simulation" | "coach";
      scenario_id: string | null;
      difficulty: string | null;
    }>(
      `
      insert into sessions(id, user_id, mode, scenario_id, difficulty)
      values ($1, $2, $3, $4, $5)
      returning id, created_at, user_id, mode, scenario_id, difficulty
      `,
      [id, input.userId, input.mode, input.scenarioId ?? null, input.difficulty ?? null]
    );
    const row = rows[0];
    return {
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      userId: row.user_id,
      mode: row.mode,
      scenarioId: row.scenario_id ?? undefined,
      difficulty: row.difficulty ?? undefined,
    };
  }

  const sessions = await readList<ServerSession>("sessions");
  const item: ServerSession = {
    id: uid("sess"),
    createdAt: new Date().toISOString(),
    userId: input.userId,
    mode: input.mode,
    scenarioId: input.scenarioId,
    difficulty: input.difficulty,
  };
  sessions.unshift(item);
  await writeList("sessions", sessions);
  return item;
}

export async function endSession(input: {
  sessionId: string;
  durationSec: number;
  messageCount: number;
  feedbackSummary?: ServerSession["feedbackSummary"];
}): Promise<ServerSession | null> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const { rows } = await p.query<{
      id: string;
      created_at: string;
      user_id: string;
      mode: "simulation" | "coach";
      scenario_id: string | null;
      difficulty: string | null;
      ended_at: string | null;
      duration_sec: number | null;
      message_count: number | null;
      feedback_summary: ServerSession["feedbackSummary"] | null;
    }>(
      `
      update sessions
      set ended_at = now(),
          duration_sec = $2,
          message_count = $3,
          feedback_summary = $4
      where id = $1
      returning id, created_at, user_id, mode, scenario_id, difficulty, ended_at, duration_sec, message_count, feedback_summary
      `,
      [input.sessionId, input.durationSec, input.messageCount, input.feedbackSummary ?? null]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      userId: row.user_id,
      mode: row.mode,
      scenarioId: row.scenario_id ?? undefined,
      difficulty: row.difficulty ?? undefined,
      endedAt: row.ended_at ? new Date(row.ended_at).toISOString() : undefined,
      durationSec: row.duration_sec ?? undefined,
      messageCount: row.message_count ?? undefined,
      feedbackSummary: row.feedback_summary ?? undefined,
    };
  }

  const sessions = await readList<ServerSession>("sessions");
  const target = sessions.find((s) => s.id === input.sessionId);
  if (!target) return null;
  target.endedAt = new Date().toISOString();
  target.durationSec = input.durationSec;
  target.messageCount = input.messageCount;
  target.feedbackSummary = input.feedbackSummary;
  await writeList("sessions", sessions);
  return target;
}

export async function appendMessages(
  sessionId: string,
  userId: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<void> {
  if (messages.length === 0) return;
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const now = new Date().toISOString();
    const values: unknown[] = [];
    const placeholders: string[] = [];
    messages.forEach((m, i) => {
      const idx = i * 6;
      placeholders.push(
        `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`
      );
      values.push(uid("msg"), now, sessionId, userId, m.role, m.content);
    });
    await p.query(
      `
      insert into messages(id, created_at, session_id, user_id, role, content)
      values ${placeholders.join(",")}
      `,
      values
    );
    return;
  }

  const list = await readList<ServerMessage>("messages");
  const now = new Date().toISOString();
  const next = messages.map((m) => ({
    id: uid("msg"),
    createdAt: now,
    sessionId,
    userId,
    role: m.role,
    content: m.content,
  }));
  list.unshift(...next);
  await writeList("messages", list);
}

export async function appendEvent(input: {
  userId?: string;
  sessionId?: string;
  event: string;
  props?: Record<string, unknown>;
}): Promise<EventRecord> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const id = uid("evt");
    const { rows } = await p.query<{
      id: string;
      created_at: string;
      user_id: string | null;
      session_id: string | null;
      event: string;
      props: Record<string, unknown> | null;
    }>(
      `
      insert into events(id, user_id, session_id, event, props)
      values ($1, $2, $3, $4, $5)
      returning id, created_at, user_id, session_id, event, props
      `,
      [id, input.userId ?? null, input.sessionId ?? null, input.event, input.props ?? null]
    );
    const row = rows[0];
    return {
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      userId: row.user_id ?? undefined,
      sessionId: row.session_id ?? undefined,
      event: row.event,
      props: row.props ?? undefined,
    };
  }

  const list = await readList<EventRecord>("events");
  const item: EventRecord = {
    id: uid("evt"),
    createdAt: new Date().toISOString(),
    userId: input.userId,
    sessionId: input.sessionId,
    event: input.event,
    props: input.props,
  };
  list.unshift(item);
  await writeList("events", list);
  return item;
}

export async function listUGC(options?: {
  status?: UGCStatus | "all";
  relationshipType?: RelationshipType;
}): Promise<ServerUGCScenario[]> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const where: string[] = [];
    const params: unknown[] = [];
    if (options?.status && options.status !== "all") {
      params.push(options.status);
      where.push(`status = $${params.length}`);
    }
    if (options?.relationshipType) {
      params.push(options.relationshipType);
      where.push(`relationship_type = $${params.length}`);
    }
    const whereSql = where.length > 0 ? `where ${where.join(" and ")}` : "";
    const { rows } = await p.query<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      relationship_type: RelationshipType;
      created_at: string;
      plays: number;
      status: UGCStatus;
      review_note: string | null;
      reviewed_at: string | null;
      reviewed_by: string | null;
    }>(
      `
      select id, user_id, title, content, relationship_type, created_at, plays, status, review_note, reviewed_at, reviewed_by
      from ugc
      ${whereSql}
      order by created_at desc
      `,
      params
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      content: r.content,
      relationshipType: r.relationship_type,
      createdAt: new Date(r.created_at).toISOString(),
      plays: r.plays,
      status: r.status,
      reviewNote: r.review_note ?? undefined,
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : undefined,
      reviewedBy: r.reviewed_by ?? undefined,
    }));
  }

  const all = await readList<ServerUGCScenario>("ugc");
  return all.filter((item) => {
    const statusOk = !options?.status || options.status === "all" || item.status === options.status;
    const relOk = !options?.relationshipType || item.relationshipType === options.relationshipType;
    return statusOk && relOk;
  });
}

export async function createUGC(input: {
  userId: string;
  title: string;
  content: string;
  relationshipType: RelationshipType;
}): Promise<ServerUGCScenario> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const id = uid("ugc");
    const { rows } = await p.query<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      relationship_type: RelationshipType;
      created_at: string;
      plays: number;
      status: UGCStatus;
    }>(
      `
      insert into ugc(id, user_id, title, content, relationship_type, status)
      values ($1, $2, $3, $4, $5, 'pending')
      returning id, user_id, title, content, relationship_type, created_at, plays, status
      `,
      [id, input.userId, input.title, input.content, input.relationshipType]
    );
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      relationshipType: row.relationship_type,
      createdAt: new Date(row.created_at).toISOString(),
      plays: row.plays,
      status: row.status,
    };
  }

  const list = await readList<ServerUGCScenario>("ugc");
  const item: ServerUGCScenario = {
    id: uid("ugc"),
    userId: input.userId,
    title: input.title,
    content: input.content,
    relationshipType: input.relationshipType,
    createdAt: new Date().toISOString(),
    plays: 0,
    status: "pending",
  };
  list.unshift(item);
  await writeList("ugc", list);
  return item;
}

export async function deleteUGC(id: string, userId: string): Promise<boolean> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const res = await p.query(`delete from ugc where id = $1 and user_id = $2`, [id, userId]);
    return (res.rowCount ?? 0) > 0;
  }

  const list = await readList<ServerUGCScenario>("ugc");
  const before = list.length;
  const next = list.filter((i) => !(i.id === id && i.userId === userId));
  if (next.length === before) return false;
  await writeList("ugc", next);
  return true;
}

export async function reviewUGC(input: {
  id: string;
  status: UGCStatus;
  note?: string;
  reviewedBy?: string;
}): Promise<ServerUGCScenario | null> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    const { rows } = await p.query<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      relationship_type: RelationshipType;
      created_at: string;
      plays: number;
      status: UGCStatus;
      review_note: string | null;
      reviewed_at: string | null;
      reviewed_by: string | null;
    }>(
      `
      update ugc
      set status = $2,
          review_note = $3,
          reviewed_by = $4,
          reviewed_at = now()
      where id = $1
      returning id, user_id, title, content, relationship_type, created_at, plays, status, review_note, reviewed_at, reviewed_by
      `,
      [input.id, input.status, input.note ?? null, input.reviewedBy ?? null]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      relationshipType: row.relationship_type,
      createdAt: new Date(row.created_at).toISOString(),
      plays: row.plays,
      status: row.status,
      reviewNote: row.review_note ?? undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
      reviewedBy: row.reviewed_by ?? undefined,
    };
  }

  const list = await readList<ServerUGCScenario>("ugc");
  const item = list.find((i) => i.id === input.id);
  if (!item) return null;
  item.status = input.status;
  item.reviewNote = input.note;
  item.reviewedBy = input.reviewedBy;
  item.reviewedAt = new Date().toISOString();
  await writeList("ugc", list);
  return item;
}

export async function incrementUGCPlay(id: string): Promise<void> {
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();
    await p.query(`update ugc set plays = plays + 1 where id = $1`, [id]);
    return;
  }

  const list = await readList<ServerUGCScenario>("ugc");
  const item = list.find((i) => i.id === id);
  if (!item) return;
  item.plays += 1;
  await writeList("ugc", list);
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function getOpsSummary(windowDays = 30): Promise<OpsSummary> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  if (hasPg) {
    await ensurePgSchema();
    const p = getPool();

    const [usersRes, sessionsRes, messagesRes, eventsRes, ugcRes, funnelRes, topScenariosRes, dailyRes] =
      await Promise.all([
        p.query<{ count: string }>(
          `select count(*)::text as count from users where created_at >= $1`,
          [since.toISOString()]
        ),
        p.query<{ sessions: string; ended: string }>(
          `select count(*)::text as sessions, count(*) filter (where ended_at is not null)::text as ended
           from sessions where created_at >= $1`,
          [since.toISOString()]
        ),
        p.query<{ count: string }>(
          `select count(*)::text as count from messages where created_at >= $1`,
          [since.toISOString()]
        ),
        p.query<{ count: string }>(
          `select count(*)::text as count from events where created_at >= $1`,
          [since.toISOString()]
        ),
        p.query<{ pending: string; approved: string; rejected: string }>(
          `select
             count(*) filter (where status='pending')::text as pending,
             count(*) filter (where status='approved')::text as approved,
             count(*) filter (where status='rejected')::text as rejected
           from ugc`
        ),
        p.query<{ user_id: string | null; viewed_home: boolean; clicked_scenario: boolean; sent_first_message: boolean; ended_session: boolean }>(
          `with base as (
             select
               user_id,
               bool_or(event = 'page_view_home') as viewed_home,
               bool_or(event = 'scenario_card_click') as clicked_scenario,
               bool_or(event = 'send_first_message') as sent_first_message,
               bool_or(event = 'session_end') as ended_session
             from events
             where created_at >= $1
             group by user_id
           )
           select user_id, viewed_home, clicked_scenario, sent_first_message, ended_session from base`,
          [since.toISOString()]
        ),
        p.query<{ scenario_id: string | null; clicks: string }>(
          `select props ->> 'scenarioId' as scenario_id, count(*)::text as clicks
           from events
           where event = 'scenario_card_click'
             and created_at >= $1
           group by 1
           order by count(*) desc
           limit 10`,
          [since.toISOString()]
        ),
        p.query<{ day: string; sessions: string; ended_sessions: string }>(
          `select
             to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
             count(*)::text as sessions,
             count(*) filter (where ended_at is not null)::text as ended_sessions
           from sessions
           where created_at >= $1
           group by 1
           order by 1 desc
           limit 30`,
          [since.toISOString()]
        ),
      ]);

    const sessions = Number(sessionsRes.rows[0]?.sessions ?? 0);
    const ended = Number(sessionsRes.rows[0]?.ended ?? 0);
    const endRatePct = sessions > 0 ? Number(((ended / sessions) * 100).toFixed(2)) : 0;

    const homeUv = funnelRes.rows.filter((r) => r.viewed_home).length;
    const clickUv = funnelRes.rows.filter((r) => r.viewed_home && r.clicked_scenario).length;
    const firstMsgUv = funnelRes.rows.filter(
      (r) => r.viewed_home && r.clicked_scenario && r.sent_first_message
    ).length;
    const endedUv = funnelRes.rows.filter(
      (r) => r.viewed_home && r.clicked_scenario && r.sent_first_message && r.ended_session
    ).length;

    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      totals: {
        users: Number(usersRes.rows[0]?.count ?? 0),
        sessions,
        endedSessions: ended,
        endRatePct,
        messages: Number(messagesRes.rows[0]?.count ?? 0),
        events: Number(eventsRes.rows[0]?.count ?? 0),
        ugcPending: Number(ugcRes.rows[0]?.pending ?? 0),
        ugcApproved: Number(ugcRes.rows[0]?.approved ?? 0),
        ugcRejected: Number(ugcRes.rows[0]?.rejected ?? 0),
      },
      funnel: {
        homeUv,
        clickUv,
        firstMsgUv,
        endedUv,
      },
      topScenarios: topScenariosRes.rows.map((r) => ({
        scenarioId: r.scenario_id || "unknown",
        clicks: Number(r.clicks),
      })),
      dailySessions: dailyRes.rows.map((r) => ({
        day: r.day,
        sessions: Number(r.sessions),
        endedSessions: Number(r.ended_sessions),
      })),
    };
  }

  const [users, sessions, messages, events, ugc] = await Promise.all([
    readList<ServerUser>("users"),
    readList<ServerSession>("sessions"),
    readList<ServerMessage>("messages"),
    readList<EventRecord>("events"),
    readList<ServerUGCScenario>("ugc"),
  ]);

  const sessionsWindow = sessions.filter((s) => new Date(s.createdAt) >= since);
  const eventsWindow = events.filter((e) => new Date(e.createdAt) >= since);
  const messagesWindow = messages.filter((m) => new Date(m.createdAt) >= since);
  const usersWindow = users.filter((u) => new Date(u.createdAt) >= since);
  const ended = sessionsWindow.filter((s) => !!s.endedAt).length;
  const endRatePct =
    sessionsWindow.length > 0
      ? Number(((ended / sessionsWindow.length) * 100).toFixed(2))
      : 0;

  const byUser = new Map<
    string,
    { home: boolean; click: boolean; first: boolean; end: boolean }
  >();
  for (const e of eventsWindow) {
    if (!e.userId) continue;
    const state = byUser.get(e.userId) ?? {
      home: false,
      click: false,
      first: false,
      end: false,
    };
    if (e.event === "page_view_home") state.home = true;
    if (e.event === "scenario_card_click") state.click = true;
    if (e.event === "send_first_message") state.first = true;
    if (e.event === "session_end") state.end = true;
    byUser.set(e.userId, state);
  }

  let homeUv = 0;
  let clickUv = 0;
  let firstMsgUv = 0;
  let endedUv = 0;
  for (const state of byUser.values()) {
    if (state.home) homeUv += 1;
    if (state.home && state.click) clickUv += 1;
    if (state.home && state.click && state.first) firstMsgUv += 1;
    if (state.home && state.click && state.first && state.end) endedUv += 1;
  }

  const scenarioClicks = new Map<string, number>();
  for (const e of eventsWindow) {
    if (e.event !== "scenario_card_click") continue;
    const sid = String(e.props?.scenarioId ?? "unknown");
    scenarioClicks.set(sid, (scenarioClicks.get(sid) ?? 0) + 1);
  }
  const topScenarios = [...scenarioClicks.entries()]
    .map(([scenarioId, clicks]) => ({ scenarioId, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const dayMap = new Map<string, { sessions: number; ended: number }>();
  for (const s of sessionsWindow) {
    const day = dayKey(s.createdAt);
    const v = dayMap.get(day) ?? { sessions: 0, ended: 0 };
    v.sessions += 1;
    if (s.endedAt) v.ended += 1;
    dayMap.set(day, v);
  }
  const dailySessions = [...dayMap.entries()]
    .map(([day, v]) => ({ day, sessions: v.sessions, endedSessions: v.ended }))
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, 30);

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    totals: {
      users: usersWindow.length,
      sessions: sessionsWindow.length,
      endedSessions: ended,
      endRatePct,
      messages: messagesWindow.length,
      events: eventsWindow.length,
      ugcPending: ugc.filter((u) => u.status === "pending").length,
      ugcApproved: ugc.filter((u) => u.status === "approved").length,
      ugcRejected: ugc.filter((u) => u.status === "rejected").length,
    },
    funnel: {
      homeUv,
      clickUv,
      firstMsgUv,
      endedUv,
    },
    topScenarios,
    dailySessions,
  };
}
