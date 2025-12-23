import { NextRequest, NextResponse } from "next/server";
import { getApplicantsByJobId } from "@/backend/jobs";
import { handleError } from "@/lib/errorHandler";
import { InvalidError } from "@/lib/errors";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const params = await context.params;
    const jobId = parseInt(params.id, 10);
    if (isNaN(jobId) || jobId <= 0) {
        throw new InvalidError("Invalid job ID");
    }

    const applicants = await getApplicantsByJobId(jobId);

    return NextResponse.json(applicants, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
