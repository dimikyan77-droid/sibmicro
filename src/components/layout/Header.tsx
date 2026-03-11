import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Globe, LogIn, Warehouse } from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import SmartSearch from "@/components/SmartSearch";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const isActiveRoute = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: lang === "ru" ? "Главная" : "Home" },
    { path: "/catalog", label: lang === "ru" ? "Поиск компонентов" : "Component Search" },
    { path: "/manufacturers", label: lang === "ru" ? "Поставщики" : "Suppliers" },
    { path: "/resources", label: lang === "ru" ? "О компании" : "About" },
    { path: "/contact", label: lang === "ru" ? "Контакты" : "Contacts" },
  ];

  const navLinkClass = (path: string) =>
    `px-3 py-2 text-[13px] font-medium tracking-wide transition-colors rounded-md ${
      isActiveRoute(path)
        ? "text-accent"
        : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="container flex h-16 items-center justify-between gap-6">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="SibMicro" className="h-8 w-8" />
          <span className="text-lg font-bold text-primary-foreground tracking-tight hidden sm:inline">SibMicro</span>
        </Link>

        {/* Center: Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={navLinkClass(item.path)}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:block w-64">
            <SmartSearch />
          </div>

          <Link
            to="/quote"
            className="hidden sm:inline-flex items-center rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-cta-foreground hover:bg-cta/90 transition-colors"
          >
            {t("header.request_quote")}
          </Link>

          <button
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
            className="p-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors"
            title={lang === "en" ? "Переключить на русский" : "Switch to English"}
          >
            <Globe className="h-4 w-4" />
          </button>

          <Link to="/cart" className="relative p-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-cta text-[10px] font-bold text-cta-foreground flex items-center justify-center">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {user && (
            <Link to="/inventory" className="p-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors hidden sm:flex" title={t("inventory.title")}>
              <Warehouse className="h-[18px] w-[18px]" />
            </Link>
          )}

          <Link
            to={user ? "/account" : "/auth"}
            className="p-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors hidden sm:flex"
            title={user ? t("header.my_account") : t("header.login")}
          >
            {user ? <User className="h-[18px] w-[18px]" /> : <LogIn className="h-[18px] w-[18px]" />}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden bg-card overflow-hidden transition-all duration-300 ease-in-out border-t border-border
          ${mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className={`p-5 space-y-1 transition-transform duration-300 ${mobileMenuOpen ? "translate-y-0" : "-translate-y-2"}`}>
          <div className="mb-3 md:hidden">
            <SmartSearch />
          </div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block py-2.5 text-sm font-medium text-foreground hover:text-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <hr className="border-border my-2" />
          <Link
            to="/quote"
            className="block py-2.5 text-sm font-semibold text-accent"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("header.request_quote")}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
