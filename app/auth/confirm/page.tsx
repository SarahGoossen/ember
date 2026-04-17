"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const allowedTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming your Ember account...");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const invalidMessage =
    !tokenHash || !typeParam || !allowedTypes.has(typeParam as EmailOtpType)
      ? "This confirmation link is missing information. Please request a new one."
      : "";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || invalidMessage || !tokenHash || !typeParam) {
      return;
    }

    const confirmedTokenHash = tokenHash;
    const confirmedType = typeParam as EmailOtpType;

    let active = true;

    const confirm = async () => {
      const { error } = await supabase.auth.verifyOtp({
        type: confirmedType,
        token_hash: confirmedTokenHash,
      });

      if (!active) {
        return;
      }

      if (error) {
        setMessage("This confirmation link has expired or is no longer valid. Please try again.");
        return;
      }

      setMessage("Your email is confirmed. Opening Ember...");
      window.setTimeout(() => {
        router.replace("/");
      }, 700);
    };

    void confirm();

    return () => {
      active = false;
    };
  }, [invalidMessage, router, tokenHash, typeParam]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(86,193,255,0.16),transparent_24%),linear-gradient(180deg,#0d1730_0%,#07101d_100%)] px-6 py-10 text-white">
      <div className="mx-auto mt-12 w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-[rgba(17,27,46,0.88)] px-6 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Ember Cloud</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Email confirmation</h1>
        <p className="mt-4 text-sm leading-7 text-[#e7f4ff]">{invalidMessage || message}</p>
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmContent />
    </Suspense>
  );
}
