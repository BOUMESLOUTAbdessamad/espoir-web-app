import { History, X, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
  onRemove: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SearchHistory = ({ history, onSelect, onClear, onRemove, isOpen, onClose }: SearchHistoryProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col shadow-lg"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Search History</span>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No search history yet</p>
                </div>
              ) : (
                <div className="space-y-0.5 px-2">
                  {history.map((query, index) => (
                    <motion.div
                      key={`${query}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        onSelect(query);
                        onClose();
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{query}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(index);
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <button
                  onClick={onClear}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-full justify-center py-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all history
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchHistory;
