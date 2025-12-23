"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ApplicantNavBar from "@/components/dashboard/ApplicantNavBar";

type ApplicationStatus = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

type Application = {
  id: number;
  companyName: string;
  title: string;
  status: ApplicationStatus;
  jobLink?: string | null;
  jobId?: number | null;
  appliedAt: string; // API usually returns ISO string
};

type MeResponse = {
  id: number;
  email: string;
  role: "APPLICANT" | "RECRUITER";
  name: string;
};

type ApplicationDetailResponse = {
  application: Application;
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

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

        // Fetch application details
        const applicationResponse = await fetch(`/api/applications/${id}`, {
          credentials: "include",
        });

        if (!applicationResponse.ok) {
          const body = (await applicationResponse.json().catch(() => null)) as any;
          throw new Error(body?.message || body?.error || "Failed to fetch application details");
        }

        const applicationData = (await applicationResponse.json()) as ApplicationDetailResponse;
        setApplication(applicationData.application);
      } catch (err: unknown) {
        console.error("Error:", err);
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (id) void fetchData();
  }, [id, router]);

  const handleGoBack = () => {
    router.push("/applicant/applications");
  };

  const getDisplayStatus = (dbStatus: ApplicationStatus | string | null | undefined) => {
    switch (dbStatus) {
      case "APPLIED":
        return "Applied";
      case "INTERVIEW":
        return "Interviewing";
      case "OFFER":
        return "Offer";
      case "REJECTED":
        return "Rejected";
      default:
        return dbStatus || "Unknown";
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

  if (error || !application) {
    return (
      <>
        <ApplicantNavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Application not found"}
          </div>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </>
    );
  }

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
          Back to My Applications
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">{application.title}</h1>
                <p className="text-xl text-gray-600 mb-2">{application.companyName}</p>
                <p className="text-sm text-gray-500">
                  Applied on {new Date(application.appliedAt).toLocaleDateString()}
                </p>
              </div>

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  application.status === "APPLIED"
                    ? "bg-blue-100 text-blue-800"
                    : application.status === "INTERVIEW"
                    ? "bg-yellow-100 text-yellow-800"
                    : application.status === "OFFER"
                    ? "bg-green-100 text-green-800"
                    : application.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                Status: {getDisplayStatus(application.status)}
              </span>
            </div>
          </div>

          {application.jobLink && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Application Link</h2>
              <a
                href={application.jobLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {application.jobLink}
              </a>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold mb-1">Next Steps</h2>
                <p className="text-gray-700">
                  {application.status === "APPLIED" && "Your application is being reviewed."}
                  {application.status === "INTERVIEW" && "Prepare for your upcoming interview!"}
                  {application.status === "OFFER" && "Congratulations on your offer!"}
                  {application.status === "REJECTED" && "Keep exploring more opportunities!"}
                </p>
              </div>

              {application.jobId && (
                <button
                  onClick={() => router.push(`/applicant/jobs/${application.jobId}`)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  View Job Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}