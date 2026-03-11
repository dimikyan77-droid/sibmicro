import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, ChevronDown, Globe, LogIn, Warehouse } from "lucide-react";
import logo from "@/assets/logo.png";
import { categories } from "@/data/mockData";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import SmartSearch from "@/components/SmartSearch";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t, tc } = useI18n();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const isActiveRoute = (path: string) => {
    if (path === "/catalog") {
      return location.pathname === "/catalog" && !location.search;
    }
    return location.pathname === path;
  };

  const navLinkClass = (path: string) =>
    `px-4 py-2.5 text-[13px] font-medium tracking-wide transition-colors ${
      isActiveRoute(path)
        ? "text-accent border-b-2 border-accent"
        : "text-primary-foreground/70 hover:text-primary-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 overflow-visible">
      {/* Utility bar */}
      <div className="bg-primary border-b border-primary-foreground/10">
        <div className="container flex h-8 items-center justify-between text-[11px] text-primary-foreground/70 tracking-wide">
          <div className="flex gap-5">
            <span>+7 (495) 123-45-67</span>
            <span className="hidden sm:inline">sales@sibmicro.ru</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/quote" className="hover:text-primary-foreground transition-colors">{t("header.request_quote")}</Link>
            <Link to="/bom" className="hover:text-primary-foreground transition-colors">{t("header.bom_upload")}</Link>
            {user && (
              <Link to="/inventory" className="hover:text-primary-foreground transition-colors flex items-center gap-1">
                <Warehouse className="h-3 w-3" />{t("inventory.title").split("/")[0].trim()}
              </Link>
            )}
            <button
              onClick={() => setLang(lang === "en" ? "ru" : "en")}
              className="flex items-center gap-1 hover:text-primary-foreground transition-colors font-medium"
              title={lang === "en" ? "Переключить на русский" : "Switch to English"}
            >
              <Globe className="h-3 w-3" />
              {lang === "en" ? "RU" : "EN"}
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-primary">
        <div className="container flex h-16 items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="SibMicro" className="h-8 w-8" />
            <span className="text-lg font-bold text-primary-foreground tracking-tight hidden sm:inline">SibMicro</span>
          </Link>

          <SmartSearch />

          <div className="flex items-center gap-1 shrink-0">
            <Link to="/cart" className="relative p-2.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
              <ShoppingCart className="h-[18px] w-[18px] text-primary-foreground/80" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">{totalItems > 99 ? "99+" : totalItems}</span>
              )}
            </Link>
            <Link to={user ? "/account" : "/auth"} className="p-2.5 rounded-lg hover:bg-primary-foreground/10 transition-colors hidden sm:flex items-center gap-1" title={user ? t("header.my_account") : t("header.login")}>
              {user ? <User className="h-[18px] w-[18px] text-primary-foreground/80" /> : <LogIn className="h-[18px] w-[18px] text-primary-foreground/80" />}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg hover:bg-primary-foreground/10 transition-colors lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-primary-foreground" /> : <Menu className="h-5 w-5 text-primary-foreground" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-primary/95 backdrop-blur hidden lg:block overflow-visible border-t border-primary-foreground/10">
        <div className="container flex items-center gap-0">
          <div
            className="relative"
            onMouseEnter={() => setCategoryMenuOpen(true)}
            onMouseLeave={() => setCategoryMenuOpen(false)}
          >
            <button className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors tracking-wide">
              {t("header.products")} <ChevronDown className="h-3 w-3" />
            </button>
            <div
              className={`absolute top-full left-0 w-[600px] bg-card border border-border rounded-lg shadow-xl p-5 grid grid-cols-2 gap-5
                transition-all duration-200 ease-out origin-top
                ${categoryMenuOpen
                  ? "opacity-100 translate-y-0 scale-y-100 pointer-events-auto"
                  : "opacity-0 -translate-y-2 scale-y-95 pointer-events-none"
                }`}
            >
              {categories.map((cat) => (
                <div key={cat.slug}>
                  <Link
                    to={`/catalog?category=${cat.slug}`}
                    className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
                  >
                    {tc(cat.name)}
                  </Link>
                  <ul className="mt-1.5 space-y-1">
                    {cat.subcategories.map((sub) => (
                      <li key={sub.slug}>
                        <Link
                          to={`/catalog?category=${cat.slug}&sub=${sub.slug}`}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {tc(sub.name)} ({sub.count.toLocaleString()})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <Link to="/manufacturers" className={navLinkClass("/manufacturers")}>{t("header.manufacturers")}</Link>
          <Link to="/octopart" className={navLinkClass("/octopart")}>{t("octopart.nav")}</Link>
          <Link to="/catalog" className={navLinkClass("/catalog")}>{t("header.full_catalog")}</Link>
          <Link to="/new-products" className={navLinkClass("/new-products")}>{t("header.new_products")}</Link>
          <Link to="/resources" className={navLinkClass("/resources")}>{t("header.resources")}</Link>
          <Link to="/contact" className={navLinkClass("/contact")}>{t("header.contact")}</Link>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden bg-card overflow-hidden transition-all duration-300 ease-in-out border-b border-border
          ${mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className={`p-5 space-y-1 transition-transform duration-300 ${mobileMenuOpen ? "translate-y-0" : "-translate-y-2"}`}>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="block py-2.5 text-sm font-medium text-foreground hover:text-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {tc(cat.name)}
            </Link>
          ))}
          <hr className="border-border my-2" />
          <Link to="/manufacturers" className="block py-2.5 text-sm text-foreground hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>{t("header.manufacturers")}</Link>
          <Link to="/contact" className="block py-2.5 text-sm text-foreground hover:text-accent transition-colors" onClick={() => setMobileMenuOpen(false)}>{t("header.contact")}</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
