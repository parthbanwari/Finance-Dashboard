import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAxiosErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const DEMO_VIEWER = "viewer@demo.finance";
const DEMO_ANALYST = "analyst@demo.finance";
const DEMO_ADMIN = "admin@demo.finance";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/dashboard";

  /** staff = viewer/analyst + password; admin = email only (passwordless) */
  const [panel, setPanel] = useState("staff");
  const [mode, setMode] = useState("viewer");
  const [email, setEmail] = useState(DEMO_VIEWER);
  const [password, setPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [adminError, setAdminError] = useState(null);

  const applyMode = useCallback((next) => {
    setMode(next);
    setEmail(next === "viewer" ? DEMO_VIEWER : DEMO_ANALYST);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/login") return;
    setPanel("staff");
    setMode("viewer");
    setEmail(DEMO_VIEWER);
    setPassword("");
    setAdminEmail("");
    setFormError(null);
    setAdminError(null);
  }, [location.pathname, location.key]);

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

  async function onSubmitMain(e) {
    e.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Enter your email address.");
      return;
    }
    if (!password) {
      setFormError("Enter the shared sign-in password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(trimmed, password, mode);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(getAxiosErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitAdmin(e) {
    e.preventDefault();
    setAdminError(null);
    const trimmed = adminEmail.trim().toLowerCase();
    if (!trimmed) {
      setAdminError("Enter the admin email.");
      return;
    }
    if (trimmed !== DEMO_ADMIN) {
      setAdminError(`Use exactly ${DEMO_ADMIN} to sign in as admin.`);
      return;
    }
    setSubmitting(true);
    try {
      await login(DEMO_ADMIN, "");
      navigate(from, { replace: true });
    } catch (err) {
      setAdminError(getAxiosErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4 py-8">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            {panel === "admin" ? "Admin sign in" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {panel === "admin"
              ? "Enter the admin email only — no password required."
              : "Viewer or analyst: use email and the shared environment password."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {panel === "staff" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => {
                  setPanel("admin");
                  setFormError(null);
                  setAdminEmail("");
                  setAdminError(null);
                }}
              >
                Sign in as admin
              </Button>

              <section aria-labelledby="staff-login-heading" className="space-y-4">
                <h2 id="staff-login-heading" className="text-sm font-semibold text-foreground">
                  Viewer or analyst
                </h2>
                <div
                  className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1"
                  role="group"
                  aria-label="Account type"
                >
                  <Button
                    type="button"
                    variant={mode === "viewer" ? "default" : "ghost"}
                    className={cn("w-full", mode !== "viewer" && "text-muted-foreground")}
                    onClick={() => applyMode("viewer")}
                  >
                    Viewer
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "analyst" ? "default" : "ghost"}
                    className={cn("w-full", mode !== "analyst" && "text-muted-foreground")}
                    onClick={() => applyMode("analyst")}
                  >
                    Analyst
                  </Button>
                </div>

                <form onSubmit={onSubmitMain} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="username"
                      type="email"
                      autoComplete="username"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {formError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {formError}
                    </p>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </section>
            </>
          ) : (
            <section aria-labelledby="admin-login-heading" className="space-y-4">
              <form onSubmit={onSubmitAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    name="admin-email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder={DEMO_ADMIN}
                    aria-invalid={!!adminError}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter <span className="font-mono text-foreground/90">{DEMO_ADMIN}</span> to
                    continue.
                  </p>
                </div>
                {adminError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {adminError}
                  </p>
                ) : null}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setPanel("staff");
                  setAdminError(null);
                }}
              >
                ← Back to sign in with email and password
              </Button>
            </section>
          )}
        </CardContent>
        <CardFooter className="flex flex-col border-t border-border bg-muted/20 px-6 py-4">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Demo users:{" "}
            <span className="font-mono text-[0.7rem]">{DEMO_VIEWER}</span>,{" "}
            <span className="font-mono text-[0.7rem]">{DEMO_ANALYST}</span>,{" "}
            <span className="font-mono text-[0.7rem]">{DEMO_ADMIN}</span>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
