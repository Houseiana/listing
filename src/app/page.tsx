import Link from "next/link";
import { Home, ArrowRight, LogIn } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="absolute right-6 top-6">
        {userId ? (
          <Link
            href="/user-profile"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Profile
          </Link>
        ) : (
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        )}
      </div>
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600">
          <Home className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Houseiana</h1>
        <p className="mt-3 text-lg text-gray-500">
          List your property in just 5 simple steps
        </p>
        <Link
          href="/add-listing"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Start Listing
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
