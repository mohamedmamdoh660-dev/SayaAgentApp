import Image from "next/image";
import { cn } from "@/lib/utils";
import { Settings } from "@/types/types";
import { useEffect, useState } from "react";

export default function Logo({ settings }: { settings: Settings }) {
  const [image, setImage] = useState("");
  useEffect(() => {
    setImage(
      settings?.logo_setting === "horizontal"
        ? settings?.logo_horizontal_url || ""
        : settings?.logo_url || ""
    );
  }, [settings]);

  if (!image) return null;
  return (
    <Image
      src={image}
      alt="logo"
      width={50}
      height={50}
      unoptimized
      className={cn(
        `w-[${settings?.logo_setting === "horizontal" ? "60%" : "100px"}] h-full object-cover rounded-md transition-opacity duration-300`,
        "opacity-100"
      )}
      style={{
        width: settings?.logo_setting === "horizontal" ? "60%" : "100px",
      }}
      priority
    />
  );
}
