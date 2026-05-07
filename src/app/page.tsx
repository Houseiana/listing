import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { LocaleSwitcher } from "@/app/components/LocaleSwitcher";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function HomePage() {
  const { userId } = await auth();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-emerald-50 via-white to-emerald-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDFDFD] border-b border-[#F0F2F5]">
        <div className="px-3 sm:px-6 lg:px-[7.5%]">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/full_logo.png"
                alt={dict.header.logoAlt}
                width={152}
                height={72}
              />
            </Link>
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              {userId ? (
                <UserButton
                  showName={false}
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                      userButtonPopoverActionButton__manageAccount: "hidden",
                    },
                  }}
                />
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <LogIn className="h-4 w-4" />
                  {dict.header.signIn}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 lg:pt-28 flex items-center justify-center">
        <div className="flex items-center flex-col gap-4 text-center">
          <Image
            src="/full_logo.png"
            alt={dict.header.logoAlt}
            width={300}
            height={300}
            className="text-white"
          />
          <h1 className="text-3xl font-bold">{dict.home.welcome}</h1>
          <p className="mt-3 text-lg text-gray-500">{dict.home.tagline}</p>
          <Link
            href="/add-listing"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#fcc519] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#e6b817]"
          >
            {dict.home.startListing}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
