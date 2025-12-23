import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { getResumesByUser } from "@/backend/resumes";
import { verifyToken } from "@//lib/authMiddleware";

export async function GET(req: NextRequest) {
    try {
      const user = verifyToken(req) as { id: number; role: string };
      const resume = await getResumesByUser(user.id);
      return NextResponse.json({ feedback: resume?.aiFeedback ?? null }, { status: 200 });
  
    } catch (error) {
      return handleError(error);
    }
}
