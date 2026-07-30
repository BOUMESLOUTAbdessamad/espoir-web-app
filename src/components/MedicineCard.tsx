import { Medicine, Pharmacy, PharmacyApiResponse } from "@/Types/MainTypes";
import { motion } from "framer-motion";
import { Navigation, MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1"
).replace(/\/$/, "");

const normalizePharmacy = (pharmacy: PharmacyApiResponse["pharmacies"][number]): Pharmacy => {
  const cityWilaya = [pharmacy.city, pharmacy.wilaya].filter(Boolean).join(", ");
  const availability = String(pharmacy.status ?? "").toLowerCase();
  return {
    id: pharmacy.id,
    name: pharmacy.name,
    address: pharmacy.address || cityWilaya || "Address not provided",
    distance: cityWilaya || "Location not provided",
    available: !["inactive", "closed", "unavailable", "false", "0"].includes(availability),
    price: "N/A",
    lat: pharmacy.lat,
    lng: pharmacy.lng,
  };
};

interface MedicineCardProps {
  medicine: Medicine;
  idx: number;
}

const MedicineCard = ({ medicine, idx }: MedicineCardProps) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoadingPharm, setIsLoadingPharm] = useState(false);

  useEffect(() => {
    if (!medicine?.id) return;
    let cancelled = false;
    setIsLoadingPharm(true);
    fetch(`${API_BASE_URL}/medicines/${medicine.id}/pharmacies?limit=3`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: PharmacyApiResponse | null) => {
        if (cancelled) return;
        if (payload?.pharmacies) {
          setPharmacies(payload.pharmacies.map(normalizePharmacy));
        } else {
          setPharmacies([]);
        }
      })
      .catch(() => {
        if (!cancelled) setPharmacies([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPharm(false);
      });
    return () => {
      cancelled = true;
    };
  }, [medicine?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
      className="shadow-md rounded-xl p-4 flex flex-col gap-2 h-full"
    >
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

      <div className="mt-auto pt-2 border-t border-border/50">
        {isLoadingPharm ? (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading pharmacies...
          </div>
        ) : pharmacies.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary" />
              Available ({pharmacies.length})
            </div>
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-foreground truncate">{pharmacy.name}</span>
                {pharmacy.lat && pharmacy.lng && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                    title="Get directions"
                  >
                    <Navigation className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default MedicineCard;
