"use client";
import { useEffect, useId } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Settings } from "@/modules/settings";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { authService } from "@/modules/auth";
import { toast } from "sonner";
import Logo from "@/components/logo";

export default function Login() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailVerificationLoading, setIsEmailVerificationLoading] =
    useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { signIn, settings } = useAuth();

  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setEmailVerificationNeeded(false);

    try {
      const result = await signIn(email, password);

      // If we get here, login was successful
      window.location.href = "/";
    } catch (error: any) {
      setIsLoading(false);

      // Handle specific error cases
      if (error.message?.includes("Email not confirmed")) {
        setEmailVerificationNeeded(true);
        setError(
          "Email not confirmed. Please verify your email or resend the verification link."
        );
      } else if (error.message?.includes("Invalid login credentials")) {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred during login"
        );
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsEmailVerificationLoading(true);
      // Since there's no direct method in authService for this,
      // we'll need to use the signUp method which triggers email verification
      await authService.resendVerificationEmail(email);
      toast.success("Verification email sent. Please check your inbox.");
      setEmailVerificationNeeded(false);
      setError(null);
    } catch (error: any) {
      // If the error indicates user already exists, that's expected

      setError(
        error instanceof Error
          ? error.message
          : "Failed to resend verification email"
      );
    } finally {
      setIsEmailVerificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-sidebar hover:bg-sidebar-hover p-8 rounded-lg shadow">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-md  border-sidebar-border relative"
            aria-hidden="true"
          >
            <Logo settings={settings as Settings} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials to login to your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${id}-email`} className="dark:text-gray-200">
                Email
              </Label>
              <Input
                id={`${id}-email`}
                placeholder="hi@yourcompany.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor={`${id}-password`} className="dark:text-gray-200">
                Password
              </Label>
              <Input
                id={`${id}-password`}
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${id}-remember`}
                className="dark:border-gray-600 cursor-pointer"
              />
              <Label
                htmlFor={`${id}-remember`}
                className="text-muted-foreground font-normal dark:text-gray-400 cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-sm underline hover:no-underline text-primary cursor-pointer"
            >
              Forgot password?
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {emailVerificationNeeded && (
              <Button
                type="button"
                onClick={handleResendVerification}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md cursor-pointer`}
                disabled={isEmailVerificationLoading}
              >
                {isEmailVerificationLoading
                  ? "Sending..."
                  : "Resend Verification Email"}
              </Button>
            )}
            <Button
              type="submit"
              className={`w-full bg-[#ec4899] hover:bg-[#ec4899]/90 text-white p-2 rounded-md cursor-pointer`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              href="https://studyinturkiye.com/became-an-agent/"
              target="_blank"
              className="text-primary hover:underline cursor-pointer"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
