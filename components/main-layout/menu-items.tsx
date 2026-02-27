import {
  ActionType,
  MenuItem,
  MenuSection,
  ResourceType,
  User,
  UserRoles,
} from "@/types/types";
import {
  RiScanLine,
  RiMessage2Line,
  RiSettings3Line,
  RiTeamLine,
  RiFileListLine,
  RiUserLine,
  RiBuildingLine,
  RiMapLine,
  RiCalendarLine,
  RiCalendar2Line,
  RiNotification3Line,
  RiBookLine,
  RiGraduationCapLine,
  RiCommunityLine,
  RiTranslate,
  RiUserStarLine,
  RiShieldUserLine,
} from "@remixicon/react";
import { SearchIcon } from "lucide-react";

const hasViewPermission = (
  userProfile: User,
  resource: ResourceType
): boolean => {
  try {
    if (!userProfile?.roles?.role_accessCollection?.edges) {
      return false;
    }

    return userProfile.roles.role_accessCollection.edges.some(
      (access: any) =>
        access.node.resource === resource &&
        access.node.action === ActionType.VIEW
    );
  } catch (error) {
    console.error("Error checking menu permissions:", error);
    return false;
  }
};

const filterMenuItems = (items: MenuItem[], userProfile: User): MenuItem[] => {
  return items.filter((item) => {
    // If no resource is specified or it's a dashboard item, show it
    if (!item.resource || item.resource === ResourceType.DASHBOARD) {
      return true;
    }
    // Check if user has view permission for this resource
    return hasViewPermission(userProfile, item.resource);
  });
};

const filterMenuSections = (
  sections: MenuSection[],
  userProfile: User
): MenuSection[] => {
  return (
    sections
      .map((section) => ({
        ...section,
        items: filterMenuItems(section.items, userProfile),
      }))
      // Only keep sections that have items
      .filter((section) => section.items.length > 0)
  );
};

export const getNavData = (user: User) => {
  // Check if user is admin or agent
  const isAdminOrAgent =
    user?.roles?.name === UserRoles.ADMIN ||
    user?.roles?.name === UserRoles.AGENT;

  // Create sections array
  const sectionsItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: RiScanLine,
      isActive: false,
      resource: ResourceType.DASHBOARD,
    },
    {
      title: "Search Programs",
      url: "/programs",
      icon: SearchIcon,
      isActive: false,
      resource: ResourceType.PROGRAMS,
    },
    {
      title: "Applications",
      url: "/applications",
      icon: RiFileListLine,
      isActive: false,
      resource: ResourceType.APPLICATIONS,
    },
    {
      title: "Students",
      url: "/students",
      icon: RiUserLine,
      isActive: false,
      resource: ResourceType.STUDENTS,
    },
    {
      title: "Announcements",
      url: "/announcements",
      icon: RiNotification3Line,
      isActive: false,
      resource: ResourceType.ANNOUNCEMENTS,
    },
    {
      title: "Universities",
      url: "/universities",
      icon: RiBuildingLine,
      isActive: false,
      resource: ResourceType.UNIVERSITIES,
    },
    {
      title: "Countries",
      url: "/countries",
      icon: RiMapLine,
      isActive: false,
      resource: ResourceType.COUNTRIES,
    },
    {
      title: "Semesters",
      url: "/semesters",
      icon: RiCalendarLine,
      isActive: false,
      resource: ResourceType.SEMESTERS,
    },
    {
      title: "Academic Years",
      url: "/academic-years",
      icon: RiCalendar2Line,
      isActive: false,
      resource: ResourceType.ACADEMIC_YEARS,
    },
    {
      title: "Faculties",
      url: "/faculties",
      icon: RiBookLine,
      isActive: false,
      resource: ResourceType.FACULTIES,
    },
    {
      title: "Specialities",
      url: "/specialities",
      icon: RiGraduationCapLine,
      isActive: false,
      resource: ResourceType.SPECIALITIES,
    },
    {
      title: "Cities",
      url: "/cities",
      icon: RiCommunityLine,
      isActive: false,
      resource: ResourceType.CITIES,
    },
    {
      title: "Degrees",
      url: "/degrees",
      icon: RiGraduationCapLine,
      isActive: false,
      resource: ResourceType.DEGREES,
    },
    {
      title: "Languages",
      url: "/languages",
      icon: RiTranslate,
      isActive: false,
      resource: ResourceType.LANGUAGES,
    },
  ];

  // Add Settings to sections for non-admin/agent users
  if (!isAdminOrAgent) {
    sectionsItems.push({
      title: "Settings",
      url: "/settings",
      icon: RiSettings3Line,
      isActive: false,
      resource: ResourceType.SETTINGS,
    });
  }

  // Create admin items array
  const adminItems = [
    {
      title: "Users",
      url: "/users",
      icon: RiTeamLine,
      isActive: false,
      resource: ResourceType.USERS,
    },
    {
      title: "Roles",
      url: "/roles",
      icon: RiUserStarLine,
      isActive: false,
      resource: ResourceType.ROLES,
    },
    {
      title: "Permissions",
      url: "/permissions",
      icon: RiShieldUserLine,
      isActive: false,
      resource: ResourceType.PERMISSIONS,
    },
  ];

  // Add Settings to admin area for admin/agent users
  if (isAdminOrAgent) {
    adminItems.unshift({
      title: "Settings",
      url: "/settings",
      icon: RiSettings3Line,
      isActive: false,
      resource: ResourceType.SETTINGS,
    });
  }

  const navMain: MenuSection[] = [
    {
      title: "Sections",
      url: "#",
      items: sectionsItems,
    },
    {
      title: "Admin Area",
      url: "#",
      items: adminItems,
    },
  ];

  const filteredNavMain = filterMenuSections(navMain, user);

  return {
    navMain: filteredNavMain,
  };
};
