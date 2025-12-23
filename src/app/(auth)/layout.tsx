import LoginNavbar from "@/components/shared/LoginNavbar";

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginNavbar />
        <div className="flex min-h-full flex-col justify-start pt-16 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    );
  }