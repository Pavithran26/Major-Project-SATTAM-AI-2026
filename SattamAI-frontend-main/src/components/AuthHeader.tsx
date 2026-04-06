"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useFirebaseAuth } from "@/components/AuthProvider";

export default function AuthHeader() {
  const { user, isLoaded } = useFirebaseAuth();

  return (
    <header className="flex justify-end items-center p-4 gap-3 h-16">
      {!isLoaded ? null : user ? (
        <>
          <span className="hidden sm:inline text-sm text-gray-700">
            {user.email || "Signed in"}
          </span>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="h-10 cursor-pointer rounded-full border border-emerald-600 px-4 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <Link
            href="/sign-in"
            className="h-10 inline-flex items-center rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="h-10 inline-flex items-center rounded-full bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Sign Up
          </Link>
        </>
      )}
    </header>
  );
}
