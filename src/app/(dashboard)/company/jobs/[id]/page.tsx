"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import RecruiterNavBar from "@/components/dashboard/RecruiterNavBar";

type Role = "APPLICANT" | "RECRUITER";

type MeResponse = {
  id: number;
  email: string;
  role: Role;
  name: string;
};

type Job = {
  id: number;
  recruiterId: number;
  companyName: string;
  title: string;
  description: string;
  requirements: string;
  salaryRange?: string | null;
  jobLink?: string | null;
  createdAt: string; // API usually returns ISO string
};

type Applicant = {
  id: number;
  name: string;
  email: string;
  education?: string | null;
  has_resume?: boolean;
  resumes?: { id: number; resumeUrl: string }[];
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id; // string

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Auth check
        const authResponse = await fetch("/api/auth/me", { credentials: "include" });
        if (!authResponse.ok) throw new Error("Not authenticated");

        const userData = (await authResponse.json()) as MeResponse;
        if (userData.role !== "RECRUITER") {
          router.push("/login");
          return;
        }

        // Job details
        const jobResponse = await fetch(`/api/jobs/${id}`, { credentials: "include" });
        if (!jobResponse.ok) {
          const body: any = await jobResponse.json().catch(() => ({}));
          throw new Error(body?.message || body?.error || "Failed to fetch job details");
        }

        const jobData = (await jobResponse.json()) as Job;
        setJob(jobData);

        // Applicants (best-effort if endpoint exists)
        const applicantsResponse = await fetch(`/api/jobs/${id}/applicants`, {
          credentials: "include",
        });

        if (applicantsResponse.ok) {
          const applicantsData = (await applicantsResponse.json()) as Applicant[];
          setApplicants(applicantsData);
        } else {
          setApplicants([]);
        }
      } catch (err: unknown) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id) void fetchData();
  }, [id, router]);

  const handleGoBack = () => router.back();

  if (loading) {
    return (
      <>
        <RecruiterNavBar />
        <div className="p-8 text-center">Loading...</div>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <RecruiterNavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Job not found"}
          </div>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <RecruiterNavBar />

      <div className="container mx-auto px-4 py-8">
        <button onClick={handleGoBack} className="mb-4 flex items-center text-gray-600 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Job Listings
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
            <p className="text-xl text-gray-600">{job.companyName}</p>
            {job.salaryRange && <p className="text-lg font-medium mt-2 text-gray-700">{job.salaryRange}</p>}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Job Description</h2>
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Requirements</h2>
              <p className="whitespace-pre-wrap">{job.requirements}</p>
            </div>

            {job.jobLink && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Application Link</h2>
                <a
                  href={job.jobLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {job.jobLink}
                </a>
              </div>
            )}

            <div className="text-sm text-gray-500">Posted on {new Date(job.createdAt).toLocaleDateString()}</div>

            <div className="pt-6 mt-6 border-t">
              <h2 className="text-lg font-semibold mb-4">Applicants</h2>

              {applicants.length === 0 ? (
                <p className="text-gray-500">No applicants yet for this position.</p>
              ) : (
                <div>
                  <p className="mb-3">
                    This job has {applicants.length} applicant{applicants.length !== 1 ? "s" : ""}.
                  </p>
                  <button
                    onClick={() => router.push(`/company/jobs/${id}/applicants`)}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    View All Applicants
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}