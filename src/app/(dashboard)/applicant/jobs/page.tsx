"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  createdAt: string; // ISO string from API
};

type MessageState = {
  type: "" | "success" | "error";
  text: string;
};

export default function ApplicantJobsPage() {
  const router = useRouter();

  const [user, setUser] = useState<MeResponse | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) throw new Error("Not authenticated");

        const userData = (await response.json()) as MeResponse;
        if (userData.role !== "APPLICANT") {
          router.push("/login");
          return;
        }

        setUser(userData);

        const jobsResponse = await fetch("/api/jobs", { credentials: "include" });
        if (!jobsResponse.ok) throw new Error("Failed to fetch jobs");

        const jobsData = (await jobsResponse.json()) as Job[];
        setJobs(jobsData);
        setFilteredJobs(jobsData);
      } catch (err: unknown) {
        console.error("Error:", err);
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    void checkAuthAndFetch();
  }, [router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = jobs.filter((job) => {
      const title = job.title?.toLowerCase() ?? "";
      const company = job.companyName?.toLowerCase() ?? "";
      const desc = job.description?.toLowerCase() ?? "";
      return title.includes(query) || company.includes(query) || desc.includes(query);
    });

    setFilteredJobs(filtered);
  };

  const handleApply = async (jobId: number) => {
    try {
      setMessage({ type: "", text: "" });
      setLoading(true);

      const response = await fetch("/api/applications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: "APPLIED" }),
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to submit application");
      }

      setMessage({ type: "success", text: "Application submitted successfully!" });

      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (err: unknown) {
      console.error("Error submitting application:", err);
      const msg = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <ApplicantNavBar />
        <div className="p-8 text-center">Loading...</div>
      </>
    );
  }

  return (
    <>
      <ApplicantNavBar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {message.text && (
          <div
            className={`p-4 mb-4 rounded-md ${
              message.type === "error"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-green-100 text-green-700 border border-green-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs by title, company, or description..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">
              {searchQuery ? "No jobs found matching your search." : "No jobs available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <p className="text-gray-600 mt-1">{job.companyName}</p>

                    {job.salaryRange && <p className="text-gray-700 mt-2">{job.salaryRange}</p>}

                    <p className="mt-3 text-gray-600 line-clamp-2">
                      {(job.description ?? "").length > 150
                        ? `${job.description.substring(0, 150)}...`
                        : job.description}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/applicant/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => handleApply(job.id)}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}