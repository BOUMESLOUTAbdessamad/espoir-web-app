import { Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

const LoadingSkeleton = () => {
  return (
    <>
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shadow-md rounded-xl p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-16 rounded-md mt-1" />
          </div>
        ))}
      </div>
    </>
  );
};

export default LoadingSkeleton;
