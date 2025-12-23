"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ApplicantNavBar from "@/components/dashboard/ApplicantNavBar";

type Role = "APPLICANT" | "RECRUITER";

type MeResponse = {
  id: number;
  email: string;
  role: Role;
  name: string;
};

type ApplicationStatus = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

type Application = {
  id: number;
  status: ApplicationStatus;
};

interface ApplicationStats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

export default function ApplicantDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchApplicationStats = async () => {
      const applicationsResponse = await fetch("/api/applications", {
        credentials: "include",
      });

      if (!applicationsResponse.ok) {
        const body: any = await applicationsResponse.json().catch(() => ({}));
        throw new Error(body?.message || body?.error || "Failed to fetch applications");
      }

      const applications = (await applicationsResponse.json()) as Application[];

      const newStats: ApplicationStats = {
        total: applications.length,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      };

      applications.forEach((app: Application) => {
        switch (app.status) {
          case "APPLIED":
            newStats.applied++;
            break;
          case "INTERVIEW":
            newStats.interview++;
            break;
          case "OFFER":
            newStats.offer++;
            break;
          case "REJECTED":
            newStats.rejected++;
            break;
        }
      });

      setStats(newStats);
    };

    const checkAuth = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const userData = (await response.json()) as MeResponse;

        if (userData.role !== "APPLICANT") {
          router.push("/login");
          return;
        }

        setUser(userData);

        await fetchApplicationStats();
      } catch (err: unknown) {
        console.error("Authentication error:", err);
        setError(err instanceof Error ? err.message : "Not authenticated");
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
        <ApplicantNavBar />
        <div className="p-8 text-center">Loading...</div>
      </>
    );
  }

  return (
    <>
      <ApplicantNavBar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Welcome, {user?.name ?? "Applicant"}</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Application Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm mb-1">Total Applications</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-500 text-sm mb-1">Applied</p>
              <p className="text-3xl font-bold text-blue-500">{stats.applied}</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-500 text-sm mb-1">Interviewing</p>
              <p className="text-3xl font-bold text-yellow-500">{stats.interview}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-500 text-sm mb-1">Offers</p>
              <p className="text-3xl font-bold text-green-500">{stats.offer}</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-500 text-sm mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/applicant/jobs")}
                className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Browse Available Jobs
              </button>

              <button
                onClick={() => router.push("/applicant/applications")}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Manage Your Applications
              </button>

              <button
                onClick={() => router.push("/applicant/profile")}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                Update Your Profile
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Application Tips</h2>
            <ul className="space-y-2 text-gray-600">
              {[
                "Keep your profile updated with your latest experiences",
                "Upload your resume to speed up the application process",
                "Regularly check for new job postings that match your skills",
                "Track your application statuses to stay organized",
              ].map((tip) => (
                <li key={tip} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}