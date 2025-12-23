"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ApplicantNavBar from "@/components/dashboard/ApplicantNavBar";

const APPLICATION_STATUSES = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"];

export default function ApplicationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Check authentication and fetch applications
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        
        const userData = await response.json();
        
        if (userData.role !== "APPLICANT") {
          router.push("/login");
          return;
        }
        
        setUser(userData);
        
        // Fetch applications for this user
        const applicationsResponse = await fetch("/api/applications", {
          credentials: "include"
        });
        
        if (!applicationsResponse.ok) {
          throw new Error("Failed to fetch applications");
        }
        
        const applicationsData = await applicationsResponse.json();
        console.log("Applications with statuses:", applicationsData.map(app => ({
          id: app.id,
          status: app.status,
          title: app.title
        })));
        setApplications(applicationsData);
        
      } catch (error) {
        console.error("Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle status update
  const updateStatus = async (applicationId, newStatus) => {
    try {
      // Clear any existing messages
      setMessage({ type: "", text: "" });
      
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update status");
      }

      // Update the local state to reflect the change immediately
      setApplications(applications.map(app => 
        app.id === applicationId ? { 
          ...app, 
          status: newStatus
        } : app
      ));

      // Close the dropdown
      setOpenStatusDropdown(null);
      
      // Show success message
      setMessage({ 
        type: "success", 
        text: `Status updated to ${getDisplayStatus(newStatus)} successfully!` 
      });
      
      // Optionally auto-clear the message after a few seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
      
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to update status. Please try again." 
      });
    }
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (applicationId) => {
    if (openStatusDropdown === applicationId) {
      setOpenStatusDropdown(null);
    } else {
      setOpenStatusDropdown(applicationId);
    }
  };

  // Get the status index for rendering the timeline
  const getStatusIndex = (status) => {
    return APPLICATION_STATUSES.indexOf(status);
  };

  // Format date to MM/DD/YY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
  };

  // Add this helper function to display friendly status names
  const getDisplayStatus = (dbStatus) => {
    switch(dbStatus) {
      case 'APPLIED': return 'Applied';
      case 'INTERVIEW': return 'Interviewing';
      case 'OFFER': return 'Offer';
      case 'REJECTED': return 'Rejected';
      default: return dbStatus || 'Unknown';
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Applications</h1>
          <button 
            onClick={() => router.push("/applicant/applications/new")}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add External Application
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
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
        
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
            <button 
              onClick={() => router.push("/applicant/jobs")}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {application.title || "Untitled Job"}
                    </h2>
                    <p className="text-gray-600">
                      {application.companyName || "Unknown Company"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Applied on {formatDate(application.appliedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => application.id ? router.push(`/applicant/applications/${application.id}`) : null}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </button>
                </div>
                
                {/* Status Timeline */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center">
                    <div className="relative flex items-center space-x-3">
                      <h3 className="text-sm font-medium">Status: </h3>
                      <button
                        onClick={() => toggleStatusDropdown(application.id)}
                        className="px-4 py-2 border border-gray-300 rounded-md flex items-center text-sm bg-white shadow-sm hover:bg-gray-50"
                      >
                        <span className={
                          application.status === "APPLIED" ? "text-blue-500" : 
                          application.status === "INTERVIEW" ? "text-yellow-500" : 
                          application.status === "OFFER" ? "text-green-500" :
                          application.status === "REJECTED" ? "text-red-500" : 
                          "text-gray-700"
                        }>
                          {getDisplayStatus(application.status)}
                        </span>
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {openStatusDropdown === application.id && (
                        <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          {APPLICATION_STATUSES.map((status) => (
                            <button
                              key={status}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                status === application.status ? "bg-blue-50 text-blue-600" : ""
                              }`}
                              onClick={() => updateStatus(application.id, status)}
                            >
                              {status === application.status && (
                                <span className="mr-2 text-blue-500">✓</span>
                              )}
                              {getDisplayStatus(status)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}