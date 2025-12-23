import prisma from "@/lib/prisma";
import { ConflictError, InvalidError, NotFoundError, UnauthorizedError } from "@/lib/errors";

export async function getApplication(id: number) {
    const application = await prisma.application.findUnique({
        where: { id },
    });

    if (!application) {
        throw new NotFoundError("Application not found");
    }

    return { status: 200, application };
}

export async function getApplicationsByUser(userId: number) {
    return await prisma.application.findMany({
        where: { userId },
        orderBy: { appliedAt: "desc" },
    });
}

export async function createApplication(userId: number, data: {
    jobId?: number;
    title?: string;
    companyName?: string;
    description?: string;
    requirements?: string;
    jobLink?: string;
}) {
    if (data.jobId) {
        // Apply to an existing job
        const job = await prisma.job.findUnique({
            where: { id: data.jobId },
        });

        if (!job) throw new InvalidError("Job not found");

        const existing = await prisma.application.findFirst({
            where: {
              userId: userId,
              jobId: job.id,
            },
          });
      
          if (existing) {
            throw new ConflictError("You have already applied for this job.");
          }

        return await prisma.application.create({
            data: {
                userId: userId,
                jobId: job.id,
                title: job.title,
                companyName: job.companyName,
                jobLink: job.jobLink,
                status: "APPLIED",
            },
        });
    } else {
        // Apply to an external/custom job
        const { title, companyName, jobLink } = data;

        if (!title || !companyName) {
            throw new InvalidError("Missing required fields for custom job");
        }

        return await prisma.application.create({
            data: {
                userId,
                jobId: null,
                title,
                companyName,
                jobLink,
                status: "APPLIED",
            },
        });
    }
}

export async function updateApplication(id: number, userId: number, data: any) {
    // console.log(id)
    const app = await prisma.application.findUnique({ where: { id: id } });
    
    if (!app) throw new NotFoundError("Application not found");
    if (app.userId !== userId) throw new UnauthorizedError("You are not authorized to update this application");

    return await prisma.application.update({
        where: { id: id },
        data,
    });
}


export async function deleteApplication(appId: number, userId: number) {
    const app = await prisma.application.findUnique({ where: { id: appId } });

    if (!app) throw new NotFoundError("Application not found");
    if (app.userId !== userId) throw new UnauthorizedError("You are not authorized to delete this application");

    await prisma.application.delete({ where: { id: appId } });
    return { message: "Application deleted successfully" };
}