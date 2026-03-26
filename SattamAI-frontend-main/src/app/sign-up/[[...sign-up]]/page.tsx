import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-green-50 to-white p-4">
      <SignUp forceRedirectUrl="/" />
    </div>
  );
}

