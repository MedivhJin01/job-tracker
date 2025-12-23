import { NextRequest, NextResponse } from "next/server";
import { getJobById, deleteJob, updateJob } from "@/backend/jobs";
import { handleError } from "@/lib/errorHandler";
import { InvalidError } from "@/lib/errors";
import { verifyToken } from "@//lib/authMiddleware";


export async function GET(req: NextRequest, context: { params: { id: string } }) {
    try {
        const params = await context.params;
        const id = parseInt(params.id, 10);

        if (isNaN(id)) {
            throw new InvalidError("Invalid job ID");
        }

        const job = await getJobById(id);
        return NextResponse.json(job, { status: 200 });
        
    } catch (error) {
        return handleError(error);
    }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    try {
        const userData = verifyToken(req) as { id: number; role: string };
        const params = await context.params;
        const jobId = parseInt(params.id, 10);

        if (isNaN(jobId)) {
            throw new InvalidError("Invalid job ID");
        }

        if (userData.role !== "RECRUITER") {
            throw new InvalidError("Only recruiters can post jobs");
        }

        const result = await deleteJob(jobId, userData);
        return NextResponse.json(result, { status: 200 });
        
    } catch (error) {
        return handleError(error);
    }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    try {
        const userData = verifyToken(req) as { id: number; role: string };
        const params = await context.params;
        const jobId = parseInt(params.id, 10);
        if (isNaN(jobId)) {
            throw new InvalidError("Invalid job ID");
        }
  
         const data = await req.json();
  
        const allowedFields = ["title", "companyName", "description", "requirements", "salaryRange", "jobLink"];
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([key]) => allowedFields.includes(key))
        );
  
        if (Object.keys(updateData).length === 0) {
            throw new InvalidError("No valid fields provided for update");
        }

        if (userData.role !== "RECRUITER") {
            throw new InvalidError("Only recruiters can post jobs");
        }
        
        const userId = userData.id;

        const updatedJob = await updateJob({
            userId,
            jobId,
            data: updateData,
        });
  
      return NextResponse.json({ message: "Job updated successfully", job: updatedJob }, { status: 200 });
      
    } catch (error) {
      return handleError(error);
    }
  }