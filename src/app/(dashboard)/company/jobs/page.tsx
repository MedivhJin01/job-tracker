"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  createdAt: string; // ISO string from API
};

export default function JobListingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<MeResponse | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) throw new Error("Not authenticated");

        const userData = (await response.json()) as MeResponse;

        if (userData.role !== "RECRUITER") {
          router.push("/login");
          return;
        }

        setUser(userData);

        // Fetch the recruiter's jobs
        const jobsResponse = await fetch("/api/jobs", { credentials: "include" });
        if (!jobsResponse.ok) {
          const body: any = await jobsResponse.json().catch(() => ({}));
          throw new Error(body?.message || body?.error || "Failed to fetch jobs");
        }

        const jobsData = (await jobsResponse.json()) as Job[];
        setJobs(jobsData);
      } catch (err: unknown) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [router]);

  const handleCreateJob = () => {
    router.push("/company/post-job");
  };

  if (loading) {
    return (
      <>
        <RecruiterNavBar />
        <div className="p-8 text-center">Loading...</div>
      </>
    );
  }

  return (
    <>
      <RecruiterNavBar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Job Listings</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
            <button
              onClick={handleCreateJob}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <p className="text-gray-600 mt-1">{job.companyName}</p>
                    {job.salaryRange && <p className="text-gray-700 mt-2">{job.salaryRange}</p>}
                  </div>

                  <Link
                    href={`/company/jobs/${job.id}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  Posted on {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}