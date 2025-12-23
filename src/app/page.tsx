import Link from "next/link";
import Image from "next/image";
import LoginNavbar from "@/components/shared/LoginNavbar";

export default function Home() {
  return (
    <>
      <LoginNavbar />
      <main className="flex min-h-screen flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 flex flex-col items-center text-center px-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Streamline Your Job Search
          </h1>
          
          <p className="mt-6 text-lg max-w-3xl mx-auto">
            Track your applications, get AI-powered resume feedback, and discover new opportunities all in one place.
            Our platform helps you stay organized during your job search journey.
          </p>
          
          <div className="mt-10 flex justify-center">
            <Link 
              href="/register" 
              className="rounded-md bg-primary px-5 py-2.5 text-center text-white shadow hover:bg-opacity-90"
            >
              Sign Up
            </Link>
          </div>
        </section>

        {/* Features Section (Optional) */}
        <section className="w-full py-12 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center p-6">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-bold mb-2">Application Tracking</h3>
                <p className="text-gray-600">
                  Keep all your job applications organized in one place with status updates.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center p-6">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2">AI Resume Feedback</h3>
                <p className="text-gray-600">
                  Get personalized feedback on your resume to improve your chances.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center p-6">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2">Progress Analytics</h3>
                <p className="text-gray-600">
                  Visualize your application progress and success rates over time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}