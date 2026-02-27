"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ListFilterPlus, X } from "lucide-react";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClearLocationSelections } from "@/context/SearchableDropdownContext";
import React, { useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/utils/format-number";

export interface ProgramsFiltersProps {
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  clearFilters: boolean;
  setClearFilters: (clearFilters: boolean) => void;
}

export default function ProgramsFilters({
  filters,
  onFiltersChange,
  clearFilters,
  setClearFilters,
}: ProgramsFiltersProps) {
  const [openFilters, setOpenFilters] = React.useState(false);
  const LOCATION = "programs-filters";
  const clearLocationSelections = useClearLocationSelections();
  const [university, setUniversity] = React.useState(filters.university || "");
  const [faculty, setFaculty] = React.useState(filters.faculty || "");
  const [speciality, setSpeciality] = React.useState(filters.speciality || "");
  const [degree, setDegree] = React.useState(filters.degree || "");
  const [country, setCountry] = React.useState(filters.country || "");
  const [city, setCity] = React.useState(filters.city || "");
  const [language, setLanguage] = React.useState(filters.language || "");
  const [active, setActive] = React.useState(filters.active || "");
  const [appsOpen, setAppsOpen] = React.useState(
    filters.active_applications || ""
  );
  const [createdFrom, setCreatedFrom] = React.useState(
    filters.created_from || ""
  );
  const [createdTo, setCreatedTo] = React.useState(filters.created_to || "");
  const DEFAULT_MIN_TUITION = 0;
  const DEFAULT_MAX_TUITION = 1550000;
  const [tuitionRange, setTuitionRange] = React.useState<[number, number]>([
    filters.minTuition ? Number(filters.minTuition) : DEFAULT_MIN_TUITION,
    filters.maxTuition ? Number(filters.maxTuition) : DEFAULT_MAX_TUITION,
  ]);

  const activeCount = Object.keys(filters || {}).length;

  useEffect(() => {
    if (clearFilters) {
      setUniversity("");
      setFaculty("");
      setSpeciality("");
      setDegree("");
      setCountry("");
      setCity("");
      setLanguage("");
      setActive("");
      setAppsOpen("");
      setCreatedFrom("");
      setCreatedTo("");
      setTuitionRange([DEFAULT_MIN_TUITION, DEFAULT_MAX_TUITION]);
      clearLocationSelections(LOCATION);
      setClearFilters(false);
    }
  }, [clearFilters, clearLocationSelections, setClearFilters]);

  return (
    <div className="px-2 flex items-center gap-2">
      <Popover open={openFilters} onOpenChange={setOpenFilters}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <ListFilterPlus className="mr-2 !h-5 !w-5" /> Advanced Filters
            {activeCount > 0 && (
              <Badge className="ml-2 h-5 px-1 text-[10px]" variant="secondary">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[780px] p-4" align="start">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SearchableDropdown
              placeholder="University"
              table="zoho-universities"
              searchField="name"
              displayField="name"
              initialValue={university}
              location={LOCATION}
              onSelect={(it: any) => setUniversity(it?.id || "")}
            />
            <SearchableDropdown
              placeholder="Faculty"
              table="zoho-faculties"
              searchField="name"
              displayField="name"
              initialValue={faculty}
              location={LOCATION}
              onSelect={(it: any) => setFaculty(it?.id || "")}
            />
            <SearchableDropdown
              placeholder="Speciality"
              table="zoho-specialities"
              searchField="name"
              displayField="name"
              initialValue={speciality}
              location={LOCATION}
              onSelect={(it: any) => setSpeciality(it?.id || "")}
            />
            <SearchableDropdown
              placeholder="Degree"
              table="zoho-degrees"
              searchField="name"
              displayField="name"
              initialValue={degree}
              location={LOCATION}
              onSelect={(it: any) => setDegree(it?.id || "")}
            />
            <SearchableDropdown
              placeholder="Country"
              table="zoho-countries"
              label="filter countries"
              searchField="name"
              displayField="name"
              initialValue={country}
              location={LOCATION}
              onSelect={(it: any) => setCountry(it?.id || "")}
            />
            <SearchableDropdown
              placeholder="City"
              table="zoho-cities"
              label="filter cities"
              searchField="name"
              displayField="name"
              initialValue={city}
              location={LOCATION}
              onSelect={(it: any) => setCity(it?.id || "")}
            />
            <SearchableDropdown
              placeholder="Language"
              table="zoho-languages"
              searchField="name"
              displayField="name"
              initialValue={language}
              location={LOCATION}
              onSelect={(it: any) => setLanguage(it?.id || "")}
            />
            <Select
              value={active}
              onValueChange={(it: any) =>
                it === "null" ? setActive("") : setActive(it)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Status (any)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Status (any)</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="col-span-1 md:col-span-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Official Tuition Range
                </span>
                <span className="text-sm font-medium">
                  {formatNumber(tuitionRange[0])} -{" "}
                  {formatNumber(tuitionRange[1])}
                </span>
              </div>
              <Slider
                min={DEFAULT_MIN_TUITION}
                max={DEFAULT_MAX_TUITION}
                defaultValue={[tuitionRange[0], tuitionRange[1]]}
                value={tuitionRange}
                onValueChange={(vals: number[]) =>
                  setTuitionRange([vals[0], vals[1] ?? vals[0]])
                }
                step={100}
                showTooltip
                tooltipContent={(v) => `${formatNumber(v)} `}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUniversity("");
                setFaculty("");
                setSpeciality("");
                setDegree("");
                setCountry("");
                setCity("");
                setLanguage("");
                setActive("");
                setAppsOpen("");
                setCreatedFrom("");
                setCreatedTo("");
                setTuitionRange([DEFAULT_MIN_TUITION, DEFAULT_MAX_TUITION]);
                clearLocationSelections(LOCATION);
                onFiltersChange({});
                setOpenFilters(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const next: Record<string, string> = {
                  university,
                  faculty,
                  speciality,
                  degree,
                  country,
                  city,
                  language,
                  active,
                  active_applications: appsOpen,
                  created_from: createdFrom,
                  created_to: createdTo,
                  minTuition:
                    tuitionRange[0] !== DEFAULT_MIN_TUITION
                      ? String(tuitionRange[0])
                      : "",
                  maxTuition:
                    tuitionRange[1] !== DEFAULT_MAX_TUITION
                      ? String(tuitionRange[1])
                      : "",
                };
                Object.keys(next).forEach((k) => {
                  if (!next[k]) delete next[k];
                });
                onFiltersChange(next);
                setOpenFilters(false);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
