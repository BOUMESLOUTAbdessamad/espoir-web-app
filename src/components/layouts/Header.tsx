import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Bot, DotIcon, Menu, Search, Sparkles, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "@/assets/logo.jpg";

interface HeaderProps {
  setSidebarOpen: () => void;
  hasSideBar: boolean;
  onToggleChat?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  isSearchLoading?: boolean;
}

const Header = ({
  setSidebarOpen,
  hasSideBar,
  onToggleChat,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  isSearchLoading,
}: HeaderProps) => {
  return (
    <header className="flex items-center gap-3 py-4 shrink-0 justify-between">
      {hasSideBar && (
        <button
          onClick={setSidebarOpen}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <Link className="flex items-center gap-2 shrink-0" to="/">
        <img src={logo} alt="Espoir DZ" className="w-9 h-9 rounded-xl" />
        <h1 className="text-lg font-bold text-foreground">
          Espoir
          <span className="text-gradient">AI</span>
        </h1>
      </Link>

      {onSearchSubmit && (
        <div className="flex-1 max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearchSubmit() }}
              placeholder="Search for a medicine..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isSearchLoading}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {onSearchSubmit && 
      (

      <div className="flex items-center gap-2 shrink-0">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          {onSearchSubmit && (
            <button
              onClick={onSearchSubmit}
              disabled={!searchValue?.trim() || isSearchLoading}
              className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {isSearchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onToggleChat}
            className="w-8 h-8 rounded-xl hover:bg-zinc-200 text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4 text-primary"/>
          </button>
          <UserButton userProfileMode="modal" />
        </Show>
      </div>
      )}

    </header>
  );
};

export default Header;
