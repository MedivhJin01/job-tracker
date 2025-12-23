import prisma from "@/lib/prisma";
import { UnauthorizedError, NotFoundError } from "@/lib/errors";

type GetJobsParams = {
    companyName?: string;
    title?: string;
    limit?: number;
    user: { id: number; role: string };
};
  
export async function getJobs({ user, companyName, title, limit }: GetJobsParams) {
    let filterByRecruiterId = false;

    if (!user) {
        throw new UnauthorizedError("User not found");
    }

    if (user.role === "RECRUITER") {
        filterByRecruiterId = true;
    }

    const jobs = await prisma.job.findMany({
        where: {
            ...(companyName && {
                companyName: { contains: companyName, mode: "insensitive" },
            }),
            ...(title && {
                title: { contains: title, mode: "insensitive" },
            }),
            ...(filterByRecruiterId && user.id && {
                recruiterId: user.id,
            }),
        },
        take: limit,
        select: {
            id: true,
            title: true,
            recruiterId: true,
            companyName: true,
            description: true,
            salaryRange: true,
            jobLink: true,
            requirements: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return jobs;
}

export async function getJobById(id: number) {
    const job = await prisma.job.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            recruiterId: true,
            companyName: true,
            description: true,
            salaryRange: true,
            jobLink: true,
            requirements: true,
            createdAt: true,
        },
    });
  
    if (!job) {
        throw new NotFoundError("Job not found");
    }
  
    return job;
}

export async function createJob(user: { id: number; role: string }, data: {
    title: string;
    companyName: string;
    description: string;
    requirements: string;
    salaryRange?: string;
    jobLink?: string;
}) {

    if (!user || user.role !== "RECRUITER") {
        throw new UnauthorizedError("Only recruiters can post jobs");
    }

    const job = await prisma.job.create({
        data: {
            recruiterId: user.id,
            ...data, 
        },
        select: {
            id: true,
            title: true,
            recruiterId: true,
            companyName: true,
            description: true,
            requirements: true,
            salaryRange: true,
            jobLink: true,
            createdAt: true,
        },
    });

    return job;
}

export async function deleteJob(jobId: number, user: { id: number; role: string }) {
    if (!user || user.role !== "RECRUITER") {
        throw new UnauthorizedError("Only recruiters can delete jobs");
    }

    const job = await prisma.job.findUnique({
        where: { id: jobId }, 
    });
  
    if (!job) {
        throw new NotFoundError("Job not found");
    }
  
    if (job.recruiterId !== user.id) {
        throw new UnauthorizedError("You are not authorized to delete this job");
    }
  
    await prisma.job.delete({
        where: { id: jobId },
    });
  
    return { message: "Job deleted successfully" };
}

type UpdateJobInput = {
    userId: number;
    jobId: number;
    data: {
        title?: string;
        companyName?: string;
        description?: string;
        requirements?: string;
        salaryRange?: string;
        jobLink?: string;
    };
};
  
export async function updateJob({ userId, jobId, data }: UpdateJobInput) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
  
    if (!job) {
        throw new NotFoundError("Job not found");
    }
  
    if (job.recruiterId !== userId) {
        throw new UnauthorizedError("You are not authorized to modify this job");
    }
  
    const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data,
        select: {
            id: true,
            title: true,
            recruiterId: true,
            createdAt: true,
            companyName: true,
            description: true,
            requirements: true,
            salaryRange: true,
            jobLink: true,
        },
    });
  
    return updatedJob;
}

export async function getApplicantsByJobId(jobId: number) {
    const applications = await prisma.application.findMany({
        where: {
            jobId: jobId,
        },
        select: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    education: true,
                    resumes: {
                        select: {
                            id: true,
                            resumeUrl: true,
                        },
                        take: 1,
                    },
                },
            },
        },
    });

    return applications.map((app) => ({
        ...app.user,
        has_resume: app.user.resumes && app.user.resumes.length > 0
    }));
}