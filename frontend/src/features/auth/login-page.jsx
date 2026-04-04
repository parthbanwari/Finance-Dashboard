import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAxiosErrorMessage } from "@/lib/errors";

export function LoginPage() {
  const { user, loading, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/dashboard";

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [info, setInfo] = useState(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function sendCode() {
    setFormError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestOtp(trimmed);
      setInfo(res.detail ?? "If an account exists, check your email for the code.");
      setStep("otp");
      setOtp("");
    } catch (err) {
      setFormError(getAxiosErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSendCode(e) {
    e.preventDefault();
    await sendCode();
  }

  async function onVerify(e) {
    e.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    const code = otp.replace(/\s/g, "");
    if (code.length !== 6) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      await verifyOtp(trimmed, code);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(getAxiosErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function goBackToEmail() {
    setStep("email");
    setOtp("");
    setFormError(null);
    setInfo(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email. We’ll send a one-time code — no password."
              : `We sent a code to ${email.trim()}. Enter it below.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={onSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send sign-in code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="space-y-4">
              {info ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {info}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="otp">One-time code</Label>
                <Input
                  id="otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d\s]/g, ""))}
                  required
                />
              </div>
              {formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" className="sm:flex-1" onClick={goBackToEmail}>
                  Change email
                </Button>
                <Button type="submit" className="sm:flex-1" disabled={submitting}>
                  {submitting ? "Verifying…" : "Sign in"}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                disabled={submitting}
                onClick={() => void sendCode()}
              >
                Resend code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
