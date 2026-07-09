import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Bot, DotIcon, Menu, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "@/assets/logo.jpg";

const Header = ({
  setSidebarOpen,
  hasSideBar,
  onToggleChat,
}: {
  setSidebarOpen: () => void;
  hasSideBar: boolean;
  onToggleChat?: () => void;
}) => {
  return (
    <header className="flex items-center gap-3 py-4 shrink-0">
      {hasSideBar && (
        <button
          onClick={setSidebarOpen}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      <Link className="flex items-center gap-2" to="/">
        <img src={logo} alt="Espoir DZ" className="w-9 h-9 rounded-xl" />
        <h1 className="text-lg font-bold text-foreground">
          Espoir
          <span className="text-gradient">AI</span>
        </h1>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <button
            onClick={onToggleChat}
            className="w-8 h-8 rounded-xl hover:bg-zinc-200 text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" color="oklch(54.6% 0.245 262.881)"/>
          </button>
          <UserButton userProfileMode="modal" />
        </Show>
      </div>
    </header>
  );
};

export default Header;
