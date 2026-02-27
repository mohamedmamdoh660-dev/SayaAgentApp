"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, getUserId, getUserProfile, useUserData } from "@/lib/utils";
import { usersService } from "@/modules/users/services/users-service";
import { Button } from "@/components/ui/button";
import { saveFile } from "@/supabase/actions/save-file";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateUserPassword } from "@/lib/actions/auth-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@/components/ui/cropper";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  UserIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Area, getCroppedImg } from "@/utils/image-crop";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/modules/auth";
import ConfirmationDialogBox from "@/components/ui/confirmation-dialog-box";

const passwordFormSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UserProfile = {
  first_name: string;
  last_name: string;
  email: string;
  profile?: string;
};

export function ProfileSettings() {
  const {
    userProfile: userProfileAuth,
    setUserProfile: setUserProfileAuth,
    signOut,
  } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());

  useEffect(() => {
    const fetchUserData = async () => {
      setUserProfile(userProfileAuth as UserProfile);
    };
    fetchUserData();
  }, [userProfileAuth]);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isEmailConfirmDialogOpen, setIsEmailConfirmDialogOpen] =
    useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [processingCountdown, setProcessingCountdown] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (processingCountdown === null) return;

    if (processingCountdown <= 0) {
      (async () => {
        try {
          await signOut();
        } catch (error) {
          console.error("Failed to sign out after email update:", error);
        } finally {
          setProcessingCountdown(null);
          setIsEmailConfirmDialogOpen(false);
          setIsUpdatingEmail(false);
          setPendingEmail("");
          setNewEmail("");
        }
      })();
      return;
    }

    const timer = setTimeout(() => {
      setProcessingCountdown((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearTimeout(timer);
  }, [processingCountdown, signOut]);

  // Password change states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Image cropper states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);

  const [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*",
  });

  const previewUrl = files[0]?.preview || null;
  const fileId = files[0]?.id;
  const previousFileIdRef = useRef<string | undefined | null>(null);

  // Callback for Cropper to provide crop data
  const handleCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!previewUrl || !fileId || !croppedAreaPixels) {
      return;
    }

    try {
      setIsUploading(true);
      // Get the cropped image blob
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);

      if (!croppedBlob) {
        throw new Error("Failed to generate cropped image blob.");
      }

      // Convert blob to file
      const file = new File([croppedBlob], "profile-image.jpg", {
        type: "image/jpeg",
      });

      // Upload the file to server/storage
      const fileUrl = await saveFile(file);
      if (fileUrl) {
        setUserProfile((prev) => ({
          ...prev,
          profile: fileUrl,
        }));
      }

      // Close the dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error during apply:", error);
      toast.error("Failed to process image");
    } finally {
      setIsUploading(false);
    }
  };

  // Effect to open dialog when a new file is ready
  useEffect(() => {
    if (fileId && fileId !== previousFileIdRef.current) {
      setIsDialogOpen(true);
      setCroppedAreaPixels(null);
      setZoom(1);
    }
    previousFileIdRef.current = fileId;
  }, [fileId]);

  const handleUpdateUserProfile = async () => {
    setIsLoading(true);
    try {
      await usersService.updateUser({
        id: userProfileAuth?.id,
        first_name: userProfile?.first_name,
        last_name: userProfile?.last_name,
        full_name: userProfile?.first_name + " " + userProfile?.last_name,
        profile: userProfile?.profile ?? null,
      });
      setUserProfileAuth({
        ...userProfileAuth,
        first_name: userProfile?.first_name,
        last_name: userProfile?.last_name,
        full_name: userProfile?.first_name + " " + userProfile?.last_name,
        profile: userProfile?.profile ?? null,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    } else if (newEmail === userProfile?.email) {
      toast.error("New email cannot be the same as the current email");
      return;
    } else if (!isValidEmail(newEmail)) {
      toast.error("Invalid email address");
      return;
    } else if (!userProfileAuth?.crm_id) {
      toast.error(
        "User not registered in CRM, so you cannot update your email address."
      );
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const existingUser = await usersService.getUserByEmail({
        email: { eq: newEmail },
      });
      if (existingUser) {
        toast.error(
          "There is problem is processing your req so please contact admininstratior."
        );
        return;
      }
      setPendingEmail(newEmail);
      setIsEmailConfirmDialogOpen(true);
    } catch (error) {
      console.error("Failed to validate email:", error);
      toast.error("Failed to validate email. Please try again.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleConfirmEmailUpdate = async () => {
    if (!pendingEmail || !userProfileAuth?.crm_id) return;
    if (processingCountdown !== null) return;
    setIsUpdatingEmail(true);
    try {
      await authService.updateEmail(
        pendingEmail,
        userProfileAuth?.crm_id || ""
      );
      toast.info(
        "We are updating your email. This may take a moment. We will log you out shortly so you can sign in with the new address."
      );
      setIsEmailDialogOpen(false);
      setProcessingCountdown(5);
      setNewEmail("");
    } catch (error) {
      console.error("Failed to update email:", error);
      toast.error("Failed to update email. Please try again.");
      setIsEmailConfirmDialogOpen(false);
      setProcessingCountdown(null);
      setPendingEmail("");
      setNewEmail("");
      setIsUpdatingEmail(false);
    }
  };

  const openEmailDialog = () => {
    setNewEmail("");
    setIsEmailDialogOpen(true);
  };

  const openPasswordDialog = () => {
    setPasswordMessage(null);
    setIsPasswordDialogOpen(true);
  };

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleChangePassword = async (
    values: z.infer<typeof passwordFormSchema>
  ) => {
    setIsChangingPassword(true);
    setPasswordMessage(null);
    try {
      // In a real implementation, you would verify the current password first
      const result = await updateUserPassword(
        userProfileAuth?.id || "",
        values.newPassword
      );
      if (!result.success) {
        setPasswordMessage({
          type: "error",
          text: result.error || "Failed to update password",
        });
        throw new Error(result.error || "Failed to update password");
      }
      toast.success("Password updated successfully");
      passwordForm.reset();
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRemoveAvatar = () => {
    setUserProfile((prev) => ({
      ...prev,
      profile: undefined,
    }));
  };

  return (
    <Card className="w-full flex-1">
      <CardHeader>
        <CardTitle className="text-2xl">Personal Information</CardTitle>
        <CardDescription>
          Update your personal details and profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture with Image Cropper */}
        <div className=" rounded-lg space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative inline-flex">
              <button
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-input bg-background hover:bg-accent/50 data-[dragging=true]:bg-accent/50"
                onClick={openFileDialog}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-dragging={isDragging || undefined}
                aria-label={
                  userProfile?.profile ? "Change image" : "Upload image"
                }
              >
                {userProfile?.profile ? (
                  <Image
                    className="h-full w-full object-cover"
                    src={userProfile?.profile}
                    alt="User avatar"
                    width={80}
                    height={80}
                  />
                ) : (
                  <div aria-hidden="true">
                    <UserIcon className="h-8 w-8 opacity-60" />
                  </div>
                )}
              </button>
              {userProfile?.profile && (
                <Button
                  onClick={handleRemoveAvatar}
                  size="icon"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                  aria-label="Remove image"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              )}
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload profile picture"
                tabIndex={-1}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {isUploading ? "Uploading..." : "Click or drag to upload"}
            </span>
          </div>
        </div>

        {/* Name Fields in Responsive Row */}
        {/* <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">Full Name</Label>
            <p className="text-sm text-muted-foreground">
              Your first and last name as you'd like it to appear
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                placeholder="Enter first name"
                value={userProfile?.first_name}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                placeholder="Enter last name"
                value={userProfile?.last_name}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div> */}

        {/* Email Field */}
        <div className="space-y-4">
          {/* <div className="space-y-1">
            <Label className="text-base font-medium">Email Address</Label>
            <p className="text-sm text-muted-foreground">
              Your email address is used for signing in
            </p>
          </div> */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">Email Address</Label>
              <p className="text-sm text-muted-foreground">
                Your email address is used for signing in
              </p>
            </div>{" "}
            <div className="flex items-center space-x-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={userProfile?.email}
                disabled
                className="bg-muted/50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openEmailDialog}
                disabled={isUpdatingEmail}
              >
                Change Email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click "Change Email" to update your email address
            </p>
          </div>
        </div>
        {/* Password Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">Password</Label>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="password"
                value="••••••••"
                disabled
                className="bg-muted/50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openPasswordDialog}
                disabled={isChangingPassword}
              >
                Change Password
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click "Change Password" to update your password
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleUpdateUserProfile} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>

      {/* Email Update Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. You will receive confirmation emails
              at both your old and new addresses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter new email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isUpdatingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEmail}
              disabled={isUpdatingEmail || !newEmail.trim()}
            >
              {isUpdatingEmail ? "Processing..." : "Update Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialogBox
        title="Confirm Email Update"
        description="You're about to change the email you use to sign in."
        content={
          <div className="space-y-2">
            <p>
              New email:{" "}
              <span className="font-semibold text-foreground">
                {pendingEmail || newEmail}
              </span>
            </p>
            <p>
              Once we process this change, we'll end your current session so you
              can log back in with the updated address.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Unsaved work stays intact, but you'll need to sign in again.
              </li>
              <li>This action cannot be undone immediately.</li>
            </ul>
          </div>
        }
        confirmText="Yes, update email"
        onConfirm={handleConfirmEmailUpdate}
        isOpen={isEmailConfirmDialogOpen}
        setIsOpen={(open) => {
          if (isUpdatingEmail && processingCountdown !== null) return;
          setIsEmailConfirmDialogOpen(open);
        }}
        loading={isUpdatingEmail}
        countdown={processingCountdown}
        countdownLabel="Signing you out in"
      />

      {/* Password Change Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your password to keep your account secure
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 pb-2">
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handleChangePassword)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {passwordMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-md text-sm",
                      passwordMessage.type === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md pb-0">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust your profile picture to fit the circular frame
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <Cropper
              className="h-96"
              image={previewUrl}
              zoom={zoom}
              onCropChange={handleCropChange}
              onZoomChange={setZoom}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          )}
          <DialogFooter className="border-t px-4 py-6">
            <div className="flex flex-col gap-4 w-full">
              {/* Zoom Controls */}
              <div className="mx-auto flex w-full max-w-80 items-center gap-4">
                <ZoomOutIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                <Slider
                  defaultValue={[1]}
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  aria-label="Zoom slider"
                />
                <ZoomInIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              </div>
              {/* Apply Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleApplyCrop}
                  disabled={!previewUrl || isUploading}
                  className="min-w-24"
                >
                  {isUploading ? "Processing..." : "Apply"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
