import { Sparkles } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

const AiOverviewLoadingSkeleton = () => {
  return (
    <div className="rounded-2xl p-5 border border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">AI Overview</h3>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full bg-primary/10" />
        <Skeleton className="h-3 w-5/6 bg-primary/10" />
        <Skeleton className="h-3 w-4/6 bg-primary/10" />
      </div>
    </div>
  );
};


export default AiOverviewLoadingSkeleton;