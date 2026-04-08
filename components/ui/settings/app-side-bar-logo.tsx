"use client";

import * as React from "react";
import Image from "next/image";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Settings } from "@/types/types";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";

export function TeamSwitcher({
  teams,
  onTeamChange,
  settings,
}: {
  teams: {
    name: string;
    logo: string;
    logo_horizontal?: string;
    logo_setting: string;
  }[];
  onTeamChange?: (team: { name: string; logo: string }) => void;
  settings?: Settings;
}) {
  const router = useRouter();
  const [activeTeam, setActiveTeam] = React.useState(teams[0] ?? null);
  if (!teams.length) return null;

  return null;
}
