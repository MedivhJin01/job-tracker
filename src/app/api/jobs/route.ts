import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { verifyToken } from "@//lib/authMiddleware";
import { InvalidError } from "@/lib/errors";
import { getJobs, createJob } from "@/backend/jobs";

export async function GET(req: NextRequest) {
    try {
        const user = verifyToken(req) as { id: number; role: string };
        
        const { searchParams } = req.nextUrl;
        const companyName = searchParams.get("company_name") ?? undefined;
        const title = searchParams.get("title") ?? undefined;
        const limitParam = searchParams.get("limit");
        const limit = limitParam && !isNaN(+limitParam) ? parseInt(limitParam, 10) : undefined;
    
        const jobs = await getJobs({ user, companyName, title, limit });
        return NextResponse.json(jobs, { status: 200 });
    } catch (error) {
        return handleError(error);
    }
}
  

export async function POST(req: NextRequest) {
    try {
        console.log(req)
        const userData = verifyToken(req) as { id: number; role: string };
        
        if (userData.role !== "RECRUITER") {
            console.log(userData.role)
            throw new InvalidError("Only recruiters can post jobs");
        }

        const body = await req.json();
        const { title, companyName, description, requirements, salaryRange, jobLink } = body;
    
        if (!title || !companyName || !description || !requirements) {
            throw new InvalidError("Missing required fields");
        }
    
        const job = await createJob(userData, {
            title,
            companyName,
            description,
            requirements,
            salaryRange,
            jobLink,
        });
    
        return NextResponse.json({ message: "Job posted successfully", job }, { status: 200 });

    } catch (error) {
        return handleError(error);
    }
}