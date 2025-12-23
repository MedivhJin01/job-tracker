"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ApplicantNavBar from "@/components/dashboard/ApplicantNavBar";

type FormState = {
  companyName: string;
  title: string;
  jobLink: string;
};

export default function NewExternalApplicationPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormState>({
    companyName: "",
    title: "",
    jobLink: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Use a boolean for disabled props
  const isLocked = loading || successMessage.length > 0;

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // Validate required fields
    if (!formData.companyName.trim() || !formData.title.trim()) {
      setError("Company name and job title are required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          title: formData.title,
          jobLink: formData.jobLink.trim() ? formData.jobLink : undefined,
          status: "APPLIED",
        }),
        credentials: "include",
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to create application");
      }

      setSuccessMessage("Application added successfully!");

      setTimeout(() => {
        router.push("/applicant/applications");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error creating application:", err);
      const message = err instanceof Error ? err.message : "Failed to create application";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ApplicantNavBar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
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
            Back
          </button>
          <h1 className="text-2xl font-bold">Add External Application</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
            <span className="ml-2 text-sm">Redirecting...</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter company name"
                required
                disabled={isLocked}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter job title"
                required
                disabled={isLocked}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="jobLink" className="block text-sm font-medium text-gray-700 mb-1">
                Job Link (Optional)
              </label>
              <input
                type="url"
                id="jobLink"
                name="jobLink"
                value={formData.jobLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/job-posting"
                disabled={isLocked}
              />
              <p className="mt-1 text-sm text-gray-500">Add the URL to the original job posting if available</p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50 transition-colors"
                disabled={isLocked}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLocked}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:bg-gray-400"
              >
                {loading ? "Submitting..." : successMessage ? "Added!" : "Add Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}