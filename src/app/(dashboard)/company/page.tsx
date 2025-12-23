"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  createdAt: string; // ISO string
};

type DashboardStats = {
  postedJobs: number;
  totalApplications: number;
};

export default function RecruiterDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    postedJobs: 0,
    totalApplications: 0,
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDashboardStats = async (jobs: Job[]) => {
      try {
        // Fetch applicant counts for each job and calculate total
        const counts = await Promise.all(
          jobs.map(async (job): Promise<number> => {
            try {
              const res = await fetch(`/api/jobs/${job.id}/applicants`, {
                credentials: "include",
              });
              if (!res.ok) return 0;
              const applicantsData = (await res.json()) as unknown[];
              return applicantsData.length;
            } catch {
              return 0;
            }
          })
        );

        const totalApplicants = counts.reduce((sum, n) => sum + n, 0);

        setDashboardStats({
          postedJobs: jobs.length,
          totalApplications: totalApplicants,
        });
      } catch (err: unknown) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      }
    };

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

        // Fetch all jobs posted by this recruiter
        const jobsResponse = await fetch("/api/jobs", { credentials: "include" });
        if (!jobsResponse.ok) throw new Error("Failed to fetch jobs");

        const jobs = (await jobsResponse.json()) as Job[];

        await fetchDashboardStats(jobs);
      } catch (err: unknown) {
        console.error("Authentication error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [router]);

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
        <h1 className="text-2xl font-bold mb-6">Welcome, {user?.name}</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 text-primary mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Jobs Posted</p>
                <p className="text-3xl font-bold">{dashboardStats.postedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Applications</p>
                <p className="text-3xl font-bold">{dashboardStats.totalApplications}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <p className="text-gray-500 mb-4">Post a new job listing or manage your existing ones.</p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/company/post-job")}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Post a New Job
            </button>

            {dashboardStats.postedJobs > 0 && (
              <button
                onClick={() => router.push("/company/jobs")}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Manage Jobs
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}