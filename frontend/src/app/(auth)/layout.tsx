export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
