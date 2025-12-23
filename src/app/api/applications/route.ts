import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { verifyToken } from "@//lib/authMiddleware";
import { InvalidError } from "@/lib/errors";
import { createApplication, getApplicationsByUser } from "@/backend/applications";

export async function GET(req: NextRequest) {
    try {
        const user = verifyToken(req) as { id: number; role: string };

        if (user.role !== "APPLICANT") {
            throw new InvalidError("Only applicants can view applications");
        }

        const applications = await getApplicationsByUser(user.id);
        return NextResponse.json(applications, { status: 200 });

    } catch (err) {
        return handleError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = verifyToken(req) as { id: number; role: string };

        if (user.role !== "APPLICANT") {
            throw new InvalidError("Only applicants can apply to jobs");
        }
        
        const body = await req.json();
        const app = await createApplication(user.id, body);
        
        return NextResponse.json(app, { status: 201 });

    } catch (err) {
        return handleError(err);
    }
}