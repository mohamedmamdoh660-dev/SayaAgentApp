import React from "react";
import { Skeleton } from "../ui/skeleton";
import { TableCell } from "../ui/table";

const DataTableSkeleton = ({ type }: { type: string }) => {
  return (
    <div className="animate-pulse w-full space-y-4 py-4">
      {[...Array(type === "selections" ? 5 : 10)].map((_, i) => (
        <Skeleton key={i} className="h-6 w-full rounded-sm bg-primary/10" />
      ))}
    </div>
  );
};

export default DataTableSkeleton;
