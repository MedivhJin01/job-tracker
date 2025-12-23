"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ApplicantNavBar from "@/components/dashboard/ApplicantNavBar";

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
  createdAt: string; // ISO from API
};

type Application = {
  id: number;
  jobId?: number | null;
  userId: number;
  status: "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";
  companyName: string;
  title: string;
  jobLink?: string | null;
  appliedAt: string;
};

export default function ApplicantJobDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = params?.id;

  const jobId = idParam ? Number(idParam) : null;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [applying, setApplying] = useState<boolean>(false);
  const [hasApplied, setHasApplied] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!jobId || Number.isNaN(jobId)) {
          throw new Error("Invalid job id");
        }

        // Check authentication
        const authResponse = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!authResponse.ok) {
          throw new Error("Not authenticated");
        }

        const userData = (await authResponse.json()) as MeResponse;

        if (userData.role !== "APPLICANT") {
          router.push("/login");
          return;
        }

        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${jobId}`, {
          credentials: "include",
        });

        if (!jobResponse.ok) {
          const body = (await jobResponse.json().catch(() => null)) as any;
          throw new Error(body?.message || body?.error || "Failed to fetch job details");
        }

        const jobData = (await jobResponse.json()) as Job;
        setJob(jobData);

        // Check if user has already applied
        const applicationsResponse = await fetch("/api/applications", {
          credentials: "include",
        });

        if (applicationsResponse.ok) {
          const applications = (await applicationsResponse.json()) as Application[];
          setHasApplied(applications.some((app: Application) => app.jobId === jobId));
        }
      } catch (err: unknown) {
        console.error("Error:", err);
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [jobId, router]);

  const handleApply = async () => {
    if (!jobId) return;

    setApplying(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
        credentials: "include",
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to apply for job");
      }

      setSuccessMessage("Application submitted successfully!");
      setHasApplied(true);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Application error:", err);
      const message = err instanceof Error ? err.message : "Failed to apply for job";
      setError(message);
    } finally {
      setApplying(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <>
        <ApplicantNavBar />
        <div className="p-8 text-center">Loading...</div>
      </>
    );
  }

  if ((error && !job) || !job) {
    return (
      <>
        <ApplicantNavBar />
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

  const applyDisabled = applying || hasApplied;

  return (
    <>
      <ApplicantNavBar />

      <div className="container mx-auto px-4 py-8">
        <button onClick={handleGoBack} className="mb-4 flex items-center text-gray-600 hover:text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Job Listings
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                <p className="text-xl text-gray-600">{job.companyName}</p>
                {job.salaryRange && <p className="text-lg font-medium mt-2 text-gray-700">{job.salaryRange}</p>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleApply}
                  disabled={applyDisabled}
                  className="px-6 py-2.5 rounded-md text-white font-medium bg-black hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-400"
                >
                  {hasApplied ? "Applied" : applying ? "Applying..." : "Apply"}
                </button>
                {hasApplied && <span className="text-sm text-gray-500">You already applied to this job.</span>}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Posted on {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="p-6 space-y-6">
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
                <p className="mt-2 text-sm text-gray-500">
                  Note: You can also apply directly through this platform using the Apply button.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}