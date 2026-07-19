import { useState } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
  className?: string;
  onSearchSubmit? : () => void
}

const VoiceSearchButton = ({ onResult, disabled, className = "", onSearchSubmit}: VoiceSearchButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceSearch();

  if (!isSupported) return null;

  const handleStart = () => {
    setIsOpen(true);
    startListening();
  };

  const handleClose = () => {
    stopListening();
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (transcript) {
      onResult(transcript);
      handleClose();
      onSearchSubmit?.();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled || isListening}
        className={`w-8 h-8 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center disabled:opacity-30 hover:bg-secondary/80 transition-colors ${className}`}
      >
        <Mic className="w-4 h-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {isListening ? "Listening..." : transcript ? "Result" : "Listening..."}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              animate={isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
            >
              <Mic className="w-8 h-8 text-primary" />
            </motion.div>
            {isListening ? (
              <p className="text-sm text-muted-foreground text-center">
                Speak now, I'm listening...
              </p>
            ) : transcript ? (
              <p className="text-sm text-foreground text-center font-medium px-4">
                "{transcript}"
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Click mic to start listening
              </p>
            )}
            <button
              onClick={handleConfirm}
              disabled={!transcript}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              Use this text
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceSearchButton;
