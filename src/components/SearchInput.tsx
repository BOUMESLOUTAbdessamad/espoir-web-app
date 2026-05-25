import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GROQ_MODELS } from "@/services/openrouter";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  isLoading: boolean;
  aiEnabled: boolean;
  onAiEnabledChange: (enabled: boolean) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
  hasAiKey: boolean;
  containerClassName?: string;
}

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  isLoading,
  aiEnabled,
  onAiEnabledChange,
  selectedModel,
  onSelectedModelChange,
  hasAiKey,
  containerClassName = "",
}: SearchInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`rounded-3xl shadow-card flex flex-col gap-2 ${
          aiEnabled ? "ai-border-glow" : "glass"
        } ${containerClassName}`}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[24px] max-h-32 overflow-y-auto"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between px-2.5 py-2.5">
          {hasAiKey && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <span
                      className={`text-xs font-medium transition-colors ${
                        aiEnabled
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      AI Mode
                    </span>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Switch
                        checked={aiEnabled}
                        onCheckedChange={onAiEnabledChange}
                        className={`data-[state=checked]:bg-primary transition-all ${
                          aiEnabled ? "shadow-md shadow-primary/30" : ""
                        }`}
                      />
                    </motion.div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[200px]">
                  <p>AI-powered search with detailed explanations and medical insights</p>
                </TooltipContent>
              </Tooltip>
              {aiEnabled && (
                <Select value={selectedModel} onValueChange={onSelectedModelChange}>
                  <SelectTrigger className="h-7 w-[130px] text-xs">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROQ_MODELS.map((model) => (
                      <SelectItem key={model} value={model} className="text-xs">
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchInput;
