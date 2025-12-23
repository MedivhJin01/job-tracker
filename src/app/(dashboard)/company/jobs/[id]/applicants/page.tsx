"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import RecruiterNavBar from "@/components/dashboard/RecruiterNavBar";

interface Applicant {
  id: number;
  name: string;
  email: string;
  education: string | null;
  has_resume: boolean;
}

interface ResumeUser {
  name: string;
  email: string;
  resumes: { resumeUrl: string }[];
}

export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;
  
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingResume, setDownloadingResume] = useState<number | null>(null);
  const [resumeUsers, setResumeUsers] = useState<ResumeUser[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication
        const authResponse = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        if (!authResponse.ok) {
          throw new Error("Not authenticated");
        }
        
        const userData = await authResponse.json();
        
        if (userData.role !== "RECRUITER") {
          router.push("/login");
          return;
        }
        
        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${jobId}`, {
          credentials: "include"
        });
        
        if (!jobResponse.ok) {
          throw new Error("Failed to fetch job details");
        }
        
        const jobData = await jobResponse.json();
        setJob(jobData);
        
        // Fetch applicants using your existing API
        const applicantsResponse = await fetch(`/api/jobs/${jobId}/applicants`, {
          credentials: "include"
        });
        
        if (!applicantsResponse.ok) {
          throw new Error("Failed to fetch applicants");
        }
        
        const applicantsData = await applicantsResponse.json();
        setApplicants(applicantsData);
        
        // Fetch resumes for this job
        const resumesResponse = await fetch(`/api/resumes?jobId=${jobId}`, {
          credentials: "include"
        });
        
        if (resumesResponse.ok) {
          const resumesData = await resumesResponse.json();
          setResumeUsers(resumesData);
        }
        
      } catch (error: any) {
        console.error("Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (jobId) {
      fetchData();
    }
  }, [jobId, router]);
  
  // Handle navigation back
  const handleGoBack = () => {
    router.back();
  };
  
  // Handle resume download
  const handleDownloadResume = async (applicantId: number) => {
    setDownloadingResume(applicantId);
    
    try {
      // Find the applicant in our applicants list
      const applicant = applicants.find(a => a.id === applicantId);
      if (!applicant) {
        throw new Error('Applicant not found');
      }
      
      // Find the corresponding user in the resume users by email (emails are unique)
      const resumeUser = resumeUsers.find(u => u.email === applicant.email);
      
      if (!resumeUser || !resumeUser.resumes || resumeUser.resumes.length === 0 || !resumeUser.resumes[0].resumeUrl) {
        throw new Error('No resume found for this applicant');
      }
      
      const resumeUrl = resumeUser.resumes[0].resumeUrl;

      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = resumeUrl;
      
      // Create a filename based on the applicant's name
      const fileName = applicant.name 
        ? `${applicant.name.replace(/\s+/g, '_')}_resume.pdf` 
        : 'resume.pdf';
        
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.error('Error downloading resume:', error);
      alert('Error downloading resume: ' + error.message);
    } finally {
      setDownloadingResume(null);
    }
  };
  
  // Check if we already have resume data for an email
  const hasResumeData = (email: string) => {
    const resumeUser = resumeUsers.find(u => u.email === email);
    return resumeUser && resumeUser.resumes && resumeUser.resumes.length > 0;
  };
  
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
        <button 
          onClick={handleGoBack}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Job Details
        </button>
        
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h1 className="text-2xl font-bold mb-2">{job.title} - Applicants</h1>
          <p className="text-gray-600">{job.companyName}</p>
        </div>
        
        {applicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No applicants for this job yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resume
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((applicant) => (
                  <tr key={applicant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{applicant.name || "Unnamed Applicant"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{applicant.education || "Not specified"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`mailto:${applicant.email}`} className="text-sm text-primary hover:text-primary-dark">
                        {applicant.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {applicant.has_resume && hasResumeData(applicant.email) ? (
                        <button
                          onClick={() => handleDownloadResume(applicant.id)}
                          disabled={downloadingResume === applicant.id}
                          className="flex items-center px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
                        >
                          {downloadingResume === applicant.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download Resume
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}