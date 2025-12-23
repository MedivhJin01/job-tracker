import { redis } from "@/lib/redis";

const TTL = Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7);
const PREFIX = "sess:";

export type SessionData = {
  userId: string;
  role: string;
  createdAt: number;
};

const key = (sid: string) => `${PREFIX}${sid}`;

export async function createSession(sid: string, data: SessionData) {
  await redis.set(key(sid), JSON.stringify(data), "EX", TTL);
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const raw = await redis.get(key(sid));
  return raw ? (JSON.parse(raw) as SessionData) : null;
}

export async function deleteSession(sid: string) {
  await redis.del(key(sid));
}

export async function refreshSession(sid: string) {
  await redis.expire(key(sid), TTL);
}