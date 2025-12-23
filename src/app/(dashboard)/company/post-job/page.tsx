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

type Message = { type: "" | "success" | "error"; text: string };

type JobCreateInput = {
  title: string;
  companyName: string;
  description: string;
  requirements: string;
  salaryRange: string; // keep as string in form
  jobLink: string; // keep as string in form
};

export default function PostJobPage() {
  const router = useRouter();

  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: "", text: "" });

  const [formData, setFormData] = useState<JobCreateInput>({
    title: "",
    companyName: "",
    description: "",
    requirements: "",
    salaryRange: "",
    jobLink: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) throw new Error("Not authenticated");

        const userData = (await response.json()) as MeResponse;

        if (userData.role !== "RECRUITER") {
          router.push("/login");
          return;
        }

        setUser(userData);
      } catch (err: unknown) {
        console.error("Authentication error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // Optional: don't send empty strings for optional fields
      const payload = {
        title: formData.title,
        companyName: formData.companyName,
        description: formData.description,
        requirements: formData.requirements,
        salaryRange: formData.salaryRange.trim() ? formData.salaryRange.trim() : undefined,
        jobLink: formData.jobLink.trim() ? formData.jobLink.trim() : undefined,
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to post job");
      }

      setFormData({
        title: "",
        companyName: "",
        description: "",
        requirements: "",
        salaryRange: "",
        jobLink: "",
      });

      setMessage({
        type: "success",
        text: "Job posted successfully! Redirecting to your job listings...",
      });

      setTimeout(() => {
        router.push("/company/jobs");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error posting job:", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error posting job. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>

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

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g. Acme Corporation"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Describe the role, responsibilities, and what a typical day looks like..."
              />
            </div>

            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                Requirements *
              </label>
              <textarea
                id="requirements"
                name="requirements"
                required
                rows={4}
                value={formData.requirements}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="List required skills, experience, education, certifications..."
              />
            </div>

            <div>
              <label htmlFor="salaryRange" className="block text-sm font-medium text-gray-700 mb-1">
                Salary Range (Optional)
              </label>
              <input
                id="salaryRange"
                name="salaryRange"
                type="text"
                value={formData.salaryRange}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g. $80,000 - $120,000 per year"
              />
            </div>

            <div>
              <label htmlFor="jobLink" className="block text-sm font-medium text-gray-700 mb-1">
                External Application Link (Optional)
              </label>
              <input
                id="jobLink"
                name="jobLink"
                type="url"
                value={formData.jobLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://your-company-careers-page.com/job-listing"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {submitting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}