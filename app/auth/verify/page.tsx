"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { authService } from "@/modules/auth";
import { toast } from "sonner";

export default function Verify() {
  const [message, setMessage] = useState("Verifying your email...");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [expiryTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours from now
  const router = useRouter();
  const { settings } = useAuth();

  useEffect(() => {
    // Check if the user has verified their email
    const checkVerification = async () => {
      try {
        // Get email from URL query params or localStorage if available
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get("email");

        if (emailParam) {
          setEmail(emailParam.replace(" ", "+"));
        }

        setMessage("Please check your email for the verification link.");
      } catch (error) {
        setMessage("An error occurred during verification.");
      }
    };

    checkVerification();
  }, []);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address not found. Please go back to signup.");
      return;
    }

    try {
      setIsLoading(true);
      await authService.resendVerificationEmail(email);
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error: any) {
      // If the error indicates user already exists, that's expected
      if (error.message?.includes("User already registered")) {
        toast.success("Verification email sent. Please check your inbox.");
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to resend verification email"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-sidebar hover:bg-sidebar-hover p-8 rounded-lg shadow">
        <div className="flex flex-col items-center gap-2">
          {(
            settings?.logo_setting === "horizontal"
              ? settings?.logo_horizontal_url
              : settings?.logo_url
          ) ? (
            <div
              className="flex shrink-0 items-center justify-center rounded-md  border-sidebar-border relative"
              aria-hidden="true"
            >
              <Image
                src={
                  (settings?.logo_setting === "horizontal"
                    ? settings?.logo_horizontal_url
                    : settings?.logo_url) ||
                  generateNameAvatar("Daxow Agent Portal")
                }
                alt="logo"
                width={50}
                height={50}
                unoptimized
                className={cn(
                  `w-[${settings?.logo_setting === "horizontal" ? "60%" : "30%"}] h-full object-cover rounded-md transition-opacity duration-300`,
                  isImageLoading ? "opacity-0" : "opacity-100"
                )}
                style={{
                  width:
                    settings?.logo_setting === "horizontal" ? "60%" : "30%",
                }}
                onLoadingComplete={() => setIsImageLoading(false)}
                priority
              />
            </div>
          ) : null}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold block mb-1">Important:</span>
              Please verify your email within the next 2 hours (by{" "}
              {expiryTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              ). After this time, the verification link will expire and you'll
              need to request a new one.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
              Verification Instructions:
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                Check your email inbox for a message from Daxow Agent Portal
              </li>
              <li>If you don't see it, check your spam or junk folder</li>
              <li>Click on the verification link in the email</li>
              <li>After verification, you can log in to your account</li>
              <li>The verification link is valid for 2 hours only</li>
            </ol>
          </div>

          <Button
            type="button"
            onClick={handleResendVerification}
            className="w-full bg-[#ec4899] hover:bg-[#ec4899]/90 text-white p-2 rounded-md cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-primary hover:underline cursor-pointer"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
