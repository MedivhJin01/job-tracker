import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "@/lib/errors";

const SECRET_KEY = process.env.JWT_SECRET!;

export type AuthClaims = {
  id: number;
  role: string;
  jti: string;
};

export function verifyToken(req: NextRequest): AuthClaims {
  const token = req.cookies.get("token")?.value;
  if (!token) throw new UnauthorizedError("Missing or invalid authorization token");

  const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;

  const id = decoded.id;
  const role = decoded.role;
  const jti = decoded.jti;

  if (typeof id !== "number" || typeof role !== "string" || typeof jti !== "string") {
    throw new UnauthorizedError("Invalid token payload");
  }

  return { id, role, jti };
}