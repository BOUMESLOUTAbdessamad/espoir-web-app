import { Medicine } from "@/Types/MainTypes";
import { motion } from "framer-motion";
import { Pill } from "lucide-react";
import { useEffect } from "react";

const MedicineCard = (medicine, idx: number) => {

  return (
    <motion.div
      key={medicine?.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
      className="shadow-md rounded-xl p-4 flex flex-col gap-2 h-full"
    >
      {/* <div className="w-8 h-8 rounded-xl bg-gradient-warm flex items-center justify-center shrink-0">
        <Pill className="w-4 h-4 text-primary-foreground" />
      </div> */}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold text-foreground truncate"
          title={medicine?.mark || medicine?.name}
        >
          {medicine?.mark || medicine?.name || "Unknown"}
        </p>
        {medicine?.dci && (
          <p
            className="text-xs text-muted-foreground truncate mt-0.5"
            title={medicine?.dci}
          >
            {medicine?.dci}
          </p>
        )}
      </div>
      {medicine?.dosage && (
        <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground self-start font-bold">
          {medicine?.dosage}
        </span>
      )}
      {/* <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary self-start mt-auto">
        #{medicine?.id}
      </span> */}
    </motion.div>
  );
};


export default MedicineCard;