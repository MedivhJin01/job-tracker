import prisma from "@/lib/prisma";
import { InvalidError, UnauthorizedError } from "@/lib/errors";
import { s3, getResumeStreamFromS3 } from "@/lib/s3"
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getResumeFeedbackFromPDF } from "@/lib/feedbackEngine";

function extractS3KeyFromUrl(resumeUrl: string): string | null {
  const match = resumeUrl.match(/\.amazonaws\.com\/(.+)$/);
  return match ? match[1] : null;
}

export async function createResume(userId: number, resumeUrl: string) {
    const existing = await prisma.resume.findFirst({
      where: { userId },
    });
  
    if (existing) {
      const key = extractS3KeyFromUrl(existing.resumeUrl);
      if (key) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: key,
            })
          );
        } catch (err) {
          console.warn("Failed to delete old S3 resume:", key, err);
        }
      }
  
      await prisma.resume.delete({
        where: { id: existing.id },
      });
    }
    const newkey = extractS3KeyFromUrl(resumeUrl);
    if (!newkey) throw new InvalidError("Failed to extract key from resume url");
    const buffer = await getResumeStreamFromS3(newkey);
    const aiFeedback = await getResumeFeedbackFromPDF(buffer);
  
    return await prisma.resume.create({
      data: {
        userId,
        resumeUrl,
        aiFeedback,
      },
    });
  }

export async function getResumesByUser(userId: number) {
    return await prisma.resume.findFirst({
        where: {userId},
        select: {
            resumeUrl: true,
            aiFeedback: true,
        },
    });
}

export async function getResumesByJob(recruiterId: number, jobId: number) {
    const job = await prisma.job.findFirst({
        where: {
            id: jobId,
            recruiterId: recruiterId,
        },
    });
    if (!job) {
        throw new UnauthorizedError("You haven't posted any jobs yet");
    }
    const applicantions = await prisma.application.findMany({
        where: {jobId},
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    resumes: {
                        select: {
                            resumeUrl: true,
                        },
                    },
                },
            },
        },
    });
    return applicantions.map((app) => app.user);
}

