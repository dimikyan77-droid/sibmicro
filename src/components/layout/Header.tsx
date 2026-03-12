import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, Globe, LogIn, Warehouse, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  const isActiveCategory = (categorySlug: string) => {
    const params = new URLSearchParams(location.search);
    return location.pathname === "/catalog" && params.get("category") === categorySlug;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-visible">
      {/* Top bar */}
      <div className="bg-primary">
        <div className="container flex h-8 items-center justify-between text-xs text-primary-foreground">
          <div className="flex gap-4">
            <span>📞 +7 (495) 123-45-67</span>
            <span className="hidden sm:inline">✉ sales@sibmicro.ru</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/quote" className="hover:underline">{t("header.request_quote")}</Link>
            <Link to="/bom" className="hover:underline">{t("header.bom_upload")}</Link>
            {user && (
              <Link to="/inventory" className="hover:underline flex items-center gap-1">
                <Warehouse className="h-3 w-3" />{t("inventory.title").split("/")[0].trim()}
              </Link>
            )}
            <button
              onClick={() => setLang(lang === "en" ? "ru" : "en")}
              className="flex items-center gap-1 hover:underline font-medium"
              title={lang === "en" ? "Переключить на русский" : "Switch to English"}
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "RU" : "EN"}
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="SibMicro" className="h-9 w-9" />
          <span className="text-xl font-bold text-primary hidden sm:inline">SibMicro</span>
        </Link>

        {/* Search */}
        <SmartSearch />

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/cart" className="relative p-2 rounded-md hover:bg-muted transition-colors">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">{totalItems > 99 ? "99+" : totalItems}</span>
            )}
          </Link>
          <Link to={user ? "/account" : "/auth"} className="p-2 rounded-md hover:bg-muted transition-colors hidden sm:flex items-center gap-1" title={user ? t("header.my_account") : t("header.login")}>
            {user ? <User className="h-5 w-5 text-foreground" /> : <LogIn className="h-5 w-5 text-foreground" />}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-muted transition-colors lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-border hidden lg:block overflow-visible">
        <div className="container flex items-center gap-0 text-sm">
          <div
            className="relative"
            onMouseEnter={() => setCategoryMenuOpen(true)}
            onMouseLeave={() => setCategoryMenuOpen(false)}
          >
            <button className="flex items-center gap-1 px-4 py-2.5 font-medium text-primary hover:bg-muted transition-colors">
              {t("header.products")} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div
              className={`absolute top-full left-0 w-[600px] bg-background border border-border rounded-b-lg shadow-lg p-4 grid grid-cols-2 gap-4
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
                    className="font-semibold text-sm text-primary hover:underline"
                  >
                    {tc(cat.name)}
                  </Link>
                  <ul className="mt-1 space-y-0.5">
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
          <Link to="/manufacturers" className={`px-4 py-2.5 transition-colors ${isActiveRoute("/manufacturers") ? "text-primary bg-primary/10 font-medium" : "text-foreground hover:bg-muted"}`}>{t("header.manufacturers")}</Link>
          <Link to="/octopart" className={`px-4 py-2.5 font-medium transition-colors ${isActiveRoute("/octopart") ? "text-accent bg-accent/10" : "text-accent hover:bg-muted"}`}>{t("octopart.nav")}</Link>
          <Link to="/catalog" className={`px-4 py-2.5 transition-colors ${isActiveRoute("/catalog") ? "text-primary bg-primary/10 font-medium" : "text-foreground hover:bg-muted"}`}>{t("header.full_catalog")}</Link>
          <Link to="/new-products" className={`px-4 py-2.5 transition-colors ${isActiveRoute("/new-products") ? "text-primary bg-primary/10 font-medium" : "text-foreground hover:bg-muted"}`}>{t("header.new_products")}</Link>
          <Link to="/resources" className={`px-4 py-2.5 transition-colors ${isActiveRoute("/resources") ? "text-primary bg-primary/10 font-medium" : "text-foreground hover:bg-muted"}`}>{t("header.resources")}</Link>
          <Link to="/contact" className={`px-4 py-2.5 transition-colors ${isActiveRoute("/contact") ? "text-primary bg-primary/10 font-medium" : "text-foreground hover:bg-muted"}`}>{t("header.contact")}</Link>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden border-border bg-background overflow-hidden transition-all duration-300 ease-in-out
          ${mobileMenuOpen
            ? "max-h-[600px] opacity-100 border-t"
            : "max-h-0 opacity-0 border-t-0"
          }`}
      >
        <div className={`p-4 space-y-2 transition-transform duration-300 ${mobileMenuOpen ? "translate-y-0" : "-translate-y-2"}`}>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {tc(cat.name)}
            </Link>
          ))}
          <hr className="border-border" />
          <Link to="/manufacturers" className="block py-2 text-sm text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t("header.manufacturers")}</Link>
          <Link to="/contact" className="block py-2 text-sm text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t("header.contact")}</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
