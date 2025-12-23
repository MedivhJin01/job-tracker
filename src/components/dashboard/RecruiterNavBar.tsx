"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function RecruiterNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (!response.ok) {
        console.error("Logout failed:", await response.text());
      }
      
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      router.push("/");
    }
  };
  
  const isActive = (path: string) => {
    return pathname === path ? "text-primary border-b-2 border-primary" : "hover:text-gray-600";
  };
  
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/company" className="font-bold text-xl mr-8">
              JobTracker
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/company/jobs" 
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/company/jobs')}`}
              >
                My Job Listings
              </Link>
              <Link 
                href="/company/post-job" 
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/company/post-job')}`}
              >
                Post New Job
              </Link>
            </nav>
          </div>
          
          <div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Log Out
            </button>
          </div>
        </div>
        
        {/* Mobile menu - shown below md breakpoint */}
        <div className="md:hidden border-t border-gray-200 pt-2 pb-3">
          <div className="space-y-1 px-2">
            <Link 
              href="/company/jobs" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/company/jobs' ? 'bg-gray-50 text-primary' : 'hover:bg-gray-50'}`}
            >
              My Job Listings
            </Link>
            <Link 
              href="/company/post-job" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/company/post-job' ? 'bg-gray-50 text-primary' : 'hover:bg-gray-50'}`}
            >
              Post New Job
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}