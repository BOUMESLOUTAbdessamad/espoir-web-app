import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "@/assets/logo.jpg";

const Header = ({ setSidebarOpen, hasSideBar }: { setSidebarOpen: () => void, hasSideBar: boolean}) => {
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
                <img
                    src={logo}
                    alt="Espoir DZ"
                    className="w-9 h-9 rounded-xl"
                />
                <h1 className="text-lg font-bold text-foreground">
                    Espoir <span className="text-gradient">AI</span>
                </h1>
                <span className="text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5  rounded-lg">Beta</span>
            </Link>
        </header>
    );
};

export default Header;
