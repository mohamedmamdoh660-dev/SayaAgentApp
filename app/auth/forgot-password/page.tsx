"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Settings, settingsService } from "@/modules/settings";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { requestPasswordReset } from "@/lib/actions/auth-actions";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const router = useRouter();
  const { settings } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await requestPasswordReset(email, "user");
      toast.success(
        "If your email exists in our system, a reset link has been sent."
      );
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      console.log("🚀 ~ handleSubmit ~ err:", err);
      toast.error("Something went wrong, so please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-sidebar hover:bg-sidebar-hover p-8 rounded-lg shadow">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-md  border-sidebar-border relative"
            aria-hidden="true"
          >
            <Logo settings={settings as Settings} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email to receive a password reset link.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="text-green-600 dark:text-green-400 text-sm text-center">
              {message}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="dark:text-gray-200">
                Email
              </Label>
              <Input
                id="email"
                placeholder="hi@yourcompany.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#ec4899] hover:bg-[#ec4899]/90 text-white p-2 rounded-md cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:underline cursor-pointer"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
