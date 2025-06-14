import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { navItems } from "@/nav-items";
import { useTranslation } from "@/contexts/TranslationContext";
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <header className="border-b border-white/20 bg-white/40 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/5">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
              📰 {t('header.title')}
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button 
                  variant={location.pathname === item.to ? "default" : "ghost"}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    location.pathname === item.to 
                      ? ""
                      : "hover:bg-white/60 hover:backdrop-blur-md hover:shadow-sm hover:border hover:border-white/30"
                  }`}
                >
                  {item.icon}
                  {t(item.titleKey)}
                </Button>
              </Link>
            ))}
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
