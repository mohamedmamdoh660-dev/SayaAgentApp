"use client";

import { useEffect, useState } from "react";
import { announcementsService } from "@/modules/announcements/services/announcements-service";
import { ZohoAnnouncement } from "@/types/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing, Loader2, Plus, RefreshCcw, Search, X } from "lucide-react";
import AnnouncementCard from "./announcement-card";
import AnnouncementDetailDialog from "./component/announcement-detail";
import AddAnnouncementDialog from "./component/add-announcement";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InfoGraphic from "@/components/ui/info-graphic";
import Loader from "@/components/loader";
import { useDebounce } from "@/hooks/use-debounce";

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<ZohoAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(
    null
  );
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<ZohoAnnouncement | null>(null);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { announcements } = await announcementsService.getAnnouncements({
        searchQuery: debouncedSearchTerm,
        category: selectedCategory,
        university: selectedUniversity,
        program: selectedProgram,
        pageSize: 100, // Load more items for the list view
      });
      setAnnouncements(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnnouncements();

    //     // Set up real-time subscription
    //     const subscription = announcementsService
    //       .subscribeToAnnouncements()
    //       .subscribe({
    //         next: ({ data }) => {
    //           if (data?.zoho_announcements) {
    //             // Filter the announcements based on current filters
    //             const filteredAnnouncements = data.zoho_announcements.filter(
    //               (announcement: Announcement) => {
    //                 let match = true;

    //                 // Apply category filter
    //                 if (
    //                   selectedCategory &&
    //                   announcement.category !== selectedCategory
    //                 ) {
    //                   match = false;
    //                 }

    //                 // Apply university filter
    //                 if (
    //                   selectedUniversity &&
    //                   announcement.university !== parseInt(selectedUniversity)
    //                 ) {
    //                   match = false;
    //                 }

    //                 // Apply program filter
    //                 if (
    //                   selectedProgram &&
    //                   announcement.program !== parseInt(selectedProgram)
    //                 ) {
    //                   match = false;
    //                 }

    //                 // Apply search filter
    //                 if (
    //                   searchQuery &&
    //                   !(
    //                     announcement.title
    //                       ?.toLowerCase()
    //                       .includes(searchQuery.toLowerCase()) ||
    //                     announcement.description
    //                       ?.toLowerCase()
    //                       .includes(searchQuery.toLowerCase())
    //                   )
    //                 ) {
    //                   match = false;
    //                 }

    //                 return match;
    //               }
    //             );

    //             setAnnouncements(filteredAnnouncements);
    //           }
    //         },
    //         error: (error) => {
    //           console.error("Subscription error:", error);
    //         },
    //       });

    //     // Clean up subscription
    //     return () => {
    //       subscription.unsubscribe();
    //     };
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedUniversity,
    selectedProgram,
  ]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnnouncements();
    setIsRefreshing(false);
  };

  // Handle view announcement
  const handleViewAnnouncement = (announcement: ZohoAnnouncement) => {
    setSelectedAnnouncement(announcement);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-1/2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 w-full focus-visible:ring-0"
            />
          </div>
          {/* <div className="flex items-center gap-2">
              <div className="w-[200px]">
                <SearchableDropdown
                  placeholder="Filter by University"
                  table="zoho-universities"
                  searchField="name"
                  displayField="name"
                  initialValue={selectedUniversity || ""}
                  onSelect={(item) => setSelectedUniversity(item.id)}
                  // onClear={() => setSelectedUniversity(null)}
                />
              </div>
              <div className="w-[200px]">
                <SearchableDropdown
                  placeholder="Filter by Program"
                  table="zoho-programs"
                  searchField="name"
                  displayField="name"
                  initialValue={selectedProgram || ""}
                  onSelect={(item) => setSelectedProgram(item.id)}
                  // onClear={() => setSelectedProgram(null)}
                />
              </div>
            </div> */}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {/* <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Announcement
          </Button> */}
        </div>
      </div>

      <div className="space-y-4">
        {/* Announcements list */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center">
            <InfoGraphic
              icon={<BellRing className="!h-16 !w-16 text-primary" />}
              title="No announcements found"
              description={
                searchQuery
                  ? `There is no announcement found for this search`
                  : `There is no announcement found at the moment`
              }
              isLeftArrow={false}
              gradient={false}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onRefresh={fetchAnnouncements}
                onView={handleViewAnnouncement}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add announcement dialog */}
      <AddAnnouncementDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onRefresh={fetchAnnouncements}
      />

      {/* View announcement dialog */}
      <AnnouncementDetailDialog
        open={!!selectedAnnouncement}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
        announcement={selectedAnnouncement}
        onRefresh={fetchAnnouncements}
      />
    </div>
  );
}
