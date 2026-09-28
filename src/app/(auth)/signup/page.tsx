"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/forms";

export default function SignupPage() {
  const [state, action] = useActionState<FormState, FormData>(signup, {});

  return (
    <div className="animate-rise" style={{ animationDelay: "80ms" }}>
      <div className="text-center">
        <p lang="ar" dir="rtl" className="ar text-2xl text-primary">
          أَهْلًا وَسَهْلًا
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Your tutor will remember your progress across every session.</p>
      </div>

      <form action={action} className="mt-8 space-y-4">
        <Field label="Your name" name="name" autoComplete="given-name" defaultValue={state.fields?.name} placeholder="e.g. Yusuf" />
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.fields?.email} placeholder="you@example.com" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." />
        <FormError message={state.error} />
        <div className="pt-2">
          <SubmitButton>Create account</SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
