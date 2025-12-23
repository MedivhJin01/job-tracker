"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ApplicantNavBar from "@/components/dashboard/ApplicantNavBar";

type Role = "APPLICANT" | "RECRUITER";

type MeResponse = {
  id: number;
  email: string;
  role: Role;
  name: string;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: Role;
  education?: string | null;
  has_resume?: boolean;
};

type ProfileResponse = {
  data: UserProfile;
};

type MessageState = {
  type: "" | "success" | "error";
  text: string;
};

type ResumeFeedbackResponse = {
  feedback?: string | null;
};

type ResumeGetResponse = {
  resumeUrl?: string | null;
};

type FormState = {
  name: string;
  email: string;
  education: string;
};

export default function ApplicantProfile() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    education: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setMessage({ type: "", text: "" });

        // Step 1: Auth user
        const authResponse = await fetch("/api/auth/me", { credentials: "include" });
        if (!authResponse.ok) throw new Error("Not authenticated");

        const me = (await authResponse.json()) as MeResponse;

        // Optional role guard
        if (me.role !== "APPLICANT") {
          router.push("/login");
          return;
        }

        // Step 2: Detailed profile
        const profileResponse = await fetch(`/api/users/${me.id}`, { credentials: "include" });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");

        const profileJson = (await profileResponse.json()) as ProfileResponse;
        const profile = profileJson.data;

        setUser(profile);

        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          education: profile.education || "",
        });

        // Step 3: Resume feedback (best-effort)
        const resumeResponse = await fetch("/api/resumes/feedback", { credentials: "include" });
        if (resumeResponse.ok) {
          const resumeData = (await resumeResponse.json()) as ResumeFeedbackResponse;
          setFeedback(resumeData?.feedback ?? null);
        } else {
          setFeedback(null);
        }
      } catch (err: unknown) {
        console.error("Error fetching profile:", err);
        const msg = err instanceof Error ? err.message : "Error loading profile";
        setMessage({ type: "error", text: msg });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (!user) throw new Error("User not loaded");

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to update profile");
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              ...formData,
            }
          : prev
      );

      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      const msg = err instanceof Error ? err.message : "Error updating profile";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "Only PDF files are allowed" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const fd = new FormData();
      fd.append("file", file);

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const data: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to upload resume");
      }

      setUser((prev) => (prev ? { ...prev, has_resume: true } : prev));
      setMessage({ type: "success", text: "Resume uploaded successfully" });

      // refresh feedback (best-effort)
      const feedbackRes = await fetch("/api/resumes/feedback", { credentials: "include" });
      if (feedbackRes.ok) {
        const fb = (await feedbackRes.json()) as ResumeFeedbackResponse;
        setFeedback(fb?.feedback ?? null);
      } else {
        setFeedback(null);
      }
    } catch (err: unknown) {
      console.error("Error uploading resume:", err);
      const msg = err instanceof Error ? err.message : "Error uploading resume";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadResume = async () => {
    try {
      setMessage({ type: "", text: "" });

      const response = await fetch("/api/resumes", { credentials: "include" });
      const data = (await response.json().catch(() => ({}))) as ResumeGetResponse;

      if (!response.ok) throw new Error("Failed to fetch resume");
      if (!data?.resumeUrl) throw new Error("No resume found");
      if (!user) throw new Error("User not loaded");

      const a = document.createElement("a");
      a.href = data.resumeUrl;
      a.download = `${user.name ? user.name.replace(/\s+/g, "_") : "resume"}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error("Error downloading resume:", err);
      const msg = err instanceof Error ? err.message : "Error downloading resume";
      setMessage({ type: "error", text: msg });
    }
  };

  if (isLoading) {
    return (
      <>
        <ApplicantNavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-10">Loading profile...</div>
        </div>
      </>
    );
  }

  // If user still null after loading (error happened), show message
  if (!user) {
    return (
      <>
        <ApplicantNavBar />
        <div className="container mx-auto px-4 py-8">
          {message.text ? (
            <div className={`p-4 mb-4 rounded-md ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {message.text}
            </div>
          ) : (
            <div className="p-4 rounded-md bg-red-100 text-red-700">Failed to load profile.</div>
          )}
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <ApplicantNavBar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message.text && (
            <div
              className={`p-4 mb-4 rounded-md ${
                message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                    Education
                  </label>
                  <textarea
                    id="education"
                    name="education"
                    value={formData.education || ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Your educational background"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || "",
                        email: user.email || "",
                        education: user.education || "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500">Full Name</h2>
                <p className="mt-1 text-lg">{user.name}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Email Address</h2>
                <p className="mt-1 text-lg">{user.email}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Education</h2>
                <p className="mt-1 text-lg">{user.education || "Not specified"}</p>
              </div>
            </div>
          )}

          {/* Resume Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Resume</h2>
            </div>

            {user.has_resume ? (
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">Resume uploaded</span>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleDownloadResume}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Resume
                  </button>

                  <label
                    htmlFor="resume-upload"
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Replace Resume
                    <input
                      type="file"
                      id="resume-upload"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start space-y-4">
                <p className="text-sm text-gray-600">
                  No resume uploaded yet. Upload your resume to make it easier to apply for jobs.
                </p>

                <label
                  htmlFor="resume-upload"
                  className={`flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors cursor-pointer ${
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Resume
                    </>
                  )}

                  <input
                    type="file"
                    id="resume-upload"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf"
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                <p className="text-xs text-gray-500">Only PDF files, maximum 5MB</p>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-medium mb-2">Feedback</h2>
            {!user.has_resume ? (
              <p className="text-gray-600">Please upload your resume for feedback</p>
            ) : feedback ? (
              <div className="whitespace-pre-wrap bg-gray-50 border p-4 rounded text-gray-800">{feedback}</div>
            ) : (
              <p className="text-gray-500 italic">Loading Feedback...</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}