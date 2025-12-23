import { redis } from "@/lib/redis";

const TTL = Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7);
const PREFIX = "sess:";

export type JwtSessionData = {
  userId: number;
  role: string;
  createdAt: number;
};

const key = (jti: string) => `${PREFIX}${jti}`;

export async function putJwtSession(jti: string, data: JwtSessionData) {
  await redis.set(key(jti), JSON.stringify(data), "EX", TTL);
}

export async function getJwtSession(jti: string): Promise<JwtSessionData | null> {
  const raw = await redis.get(key(jti));
  return raw ? (JSON.parse(raw) as JwtSessionData) : null;
}

export async function deleteJwtSession(jti: string) {
  await redis.del(key(jti));
}