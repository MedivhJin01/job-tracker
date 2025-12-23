import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { verifyToken } from "@//lib/authMiddleware";
import { InvalidError } from "@/lib/errors";
import { createResume, getResumesByUser, getResumesByJob } from "@/backend/resumes";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
    try {
        const user = verifyToken(req) as {id: number; role: string};
        if (user.role != "APPLICANT") {
            throw new InvalidError("Only applicants can upload resume");
        }
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (file.type !== "application/pdf") {
            throw new InvalidError("Only PDF files are allowed");
        }
        const resumeUrl = await uploadToS3(file);
        const resume = await createResume(user.id, resumeUrl);
        return NextResponse.json(resume, {status: 201});
    } catch (error) {
        return handleError(error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = verifyToken(req) as {id: number; role: string};
        const {searchParams} = new URL(req.url);
        const jobId = searchParams.get("jobId");
        if (user.role === "APPLICANT") {
            const resume = await getResumesByUser(user.id);
            return NextResponse.json(resume, {status: 200});
        }
        if (user.role === "RECRUITER"){
            if (!jobId) {
                throw new InvalidError("jobId is required to view resumes for a job you posted");
            }
            const resumes = await getResumesByJob(user.id, parseInt(jobId));
            return NextResponse.json(resumes, {status: 200});
        }
    } catch (error) {
        return handleError(error);
    }
}