"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/forms";

export default function LoginPage() {
  const [state, action] = useActionState<FormState, FormData>(login, {});

  return (
    <div className="animate-rise" style={{ animationDelay: "80ms" }}>
      <div className="text-center">
        <p lang="ar" dir="rtl" className="ar text-2xl text-primary">
          مَرْحَبًا بِعَوْدَتِكَ
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to continue your lessons.</p>
      </div>

      <form action={action} className="mt-8 space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.fields?.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
        <FormError message={state.error} />
        <div className="pt-2">
          <SubmitButton>Sign in</SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
