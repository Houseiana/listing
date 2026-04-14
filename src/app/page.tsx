import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function HomePage() {
  const { userId } = await auth();
  console.log("User ID:", userId);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="absolute right-6 top-6">
        {userId ? (
          ''
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
      <div className="flex items-center flex-col gap-4 text-center">
        <Image src="/full_logo.png" alt="Houseiana Logo" width={300} height={300} className="text-white" />
        <h1 className="text-3xl  font-bold">Welcome to Houseiana</h1>
        <p className="mt-3 text-lg text-gray-500">
          List your property in just simple steps
        </p>
        <Link
          href="/add-listing"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#fcc519] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#e6b817]"
        >
          Start Listing
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
