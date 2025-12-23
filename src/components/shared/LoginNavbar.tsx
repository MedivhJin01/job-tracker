"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = async () => {
      try {
        // Check if there's a token in cookies before making the request
        const hasToken = document.cookie.split(';').some(item => item.trim().startsWith('token='));
        
        if (!hasToken) {
          // No token found, we're definitely not logged in
          setIsLoggedIn(false);
          setIsLoading(false);
          return;
        }
        
        // If we have a token, verify it with the server
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setUserRole(userData.role);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Determine dashboard path based on user role
  const getDashboardPath = () => {
    return userRole === "RECRUITER" ? "/company" : "/applicant";
  };
  
  return (
    <header className="w-full py-4 border-b">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">JobTracker</Link>
        <nav className="flex gap-4">
          {isLoading ? (
            // Show a placeholder button while checking auth status
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-400">
              ...
            </div>
          ) : isLoggedIn ? (
            // Show dashboard button if logged in
            <Link 
              href={getDashboardPath()}
              className="px-4 py-2 border border-gray-300 rounded-md bg-primary text-white shadow-sm hover:bg-primary-700 transition-colors" 
            >
              Dashboard
            </Link>
          ) : (
            // Show login button if not logged in
            <Link 
              href="/login"
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors" 
            >
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}