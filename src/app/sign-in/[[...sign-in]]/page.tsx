import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <SignIn
        routing="path" 
        path="/sign-in" 
        signUpUrl={undefined}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg rounded-2xl",
          },
        }}

      />
    </div>
  );
}
