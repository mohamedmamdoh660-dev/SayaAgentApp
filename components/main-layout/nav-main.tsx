"use client";

import { useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { SidebarGroupContent, useSidebar } from "@/components/ui/sidebar";
import { RemixiconComponentType } from "@remixicon/react";
import { SearchForm } from "@/components/search-form";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types/types";
import Link from "next/link";

type IconType = LucideIcon | RemixiconComponentType;

interface NavSubItem {
  title: string;
  url: string;
  icon?: IconType;
  isActive?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon?: IconType;
  isActive?: boolean;
  unreadCount?: number;
  items?: NavSubItem[];
}

interface NavSection {
  title: string;
  url: string;
  items: NavItem[];
}

export function NavMain({ items, user }: { items: NavSection[]; user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigation = (url: string) => {
    router.push(url);

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isRouteActive = (url: string) => {
    if (url === "/" && pathname === "/") return true;
    return url !== "/" && pathname.startsWith(url);
  };

  const filterItems = (items: NavItem[], term: string): NavItem[] => {
    if (!term) return items;

    return items.reduce<NavItem[]>((acc, item) => {
      // Check if the current item matches
      const itemMatches = item.title.toLowerCase().includes(term.toLowerCase());

      // If there are subitems, filter them
      let filteredSubItems: NavSubItem[] | undefined;
      if (item.items) {
        filteredSubItems = item.items.filter((subItem) =>
          subItem.title.toLowerCase().includes(term.toLowerCase())
        );
      }

      // Include the item if it matches or has matching subitems
      if (itemMatches || (filteredSubItems && filteredSubItems.length > 0)) {
        acc.push({
          ...item,
          items: filteredSubItems,
        });
      }

      return acc;
    }, []);
  };

  const filterSections = (
    sections: NavSection[],
    term: string
  ): NavSection[] => {
    if (!term) return sections;

    return sections.reduce<NavSection[]>((acc, section) => {
      const filteredItems = filterItems(section.items, term);
      if (filteredItems.length > 0) {
        acc.push({
          ...section,
          items: filteredItems,
        });
      }
      return acc;
    }, []);
  };

  const filteredSections = filterSections(items, searchTerm);

  return (
    <>
      <SearchForm onSearch={setSearchTerm} className="mt-3" />

      {filteredSections.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel className="uppercase text-muted-foreground/60">
            {section.title}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {section.items &&
                section.items.map((item) => {
                  if (item.items?.length) {
                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isRouteActive(item.url)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={isRouteActive(item.url)}
                              className="group/menu-button font-medium gap-3"
                            >
                              {item.icon && (
                                <item.icon
                                  className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                  size={22}
                                  aria-hidden="true"
                                />
                              )}
                              <span>{item.title}</span>
                              {item.unreadCount && item.unreadCount > 0 ? (
                                <span className="ml-auto shrink-0 bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                                  {item.unreadCount}
                                </span>
                              ) : (
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isRouteActive(subItem.url)}
                                  >
                                    <Link href={subItem.url}>
                                      {subItem.icon && (
                                        <subItem.icon
                                          className="!text-muted-foreground group-data-[active=true]/menu-button:text-primary"
                                          size={22}
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span className="">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                        isActive={isRouteActive(item.url)}
                      >
                        <Link
                          href={item.url}
                          className="flex items-center w-full"
                        >
                          {item.icon && (
                            <item.icon
                              className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                              size={22}
                              aria-hidden="true"
                            />
                          )}
                          <span>{item.title}</span>
                          {item.unreadCount && item.unreadCount > 0 ? (
                            <span className="ml-auto shrink-0 bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                              {item.unreadCount}
                            </span>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
