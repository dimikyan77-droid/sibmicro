import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Globe, LogIn } from "lucide-react";
import logo from "@/assets/logo.png";
import { categories } from "@/data/mockData";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top bar */}
      <div className="bg-primary">
        <div className="container flex h-8 items-center justify-between text-xs text-primary-foreground">
          <div className="flex gap-4">
            <span>📞 +7 (495) 123-45-67</span>
            <span className="hidden sm:inline">✉ sales@sibmicro.com</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/quote" className="hover:underline">{t("header.request_quote")}</Link>
            <Link to="/bom" className="hover:underline">{t("header.bom_upload")}</Link>
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
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("header.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pl-10 pr-20"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("header.search")}
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/cart" className="relative p-2 rounded-md hover:bg-muted transition-colors">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">0</span>
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
      <nav className="border-t border-border hidden lg:block">
        <div className="container flex items-center gap-0 text-sm">
          <div
            className="relative"
            onMouseEnter={() => setCategoryMenuOpen(true)}
            onMouseLeave={() => setCategoryMenuOpen(false)}
          >
            <button className="flex items-center gap-1 px-4 py-2.5 font-medium text-primary hover:bg-muted transition-colors">
              {t("header.products")} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {categoryMenuOpen && (
              <div className="absolute top-full left-0 w-[600px] bg-background border border-border rounded-b-lg shadow-lg p-4 grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <Link
                      to={`/catalog?category=${cat.slug}`}
                      className="font-semibold text-sm text-primary hover:underline"
                    >
                      {cat.name}
                    </Link>
                    <ul className="mt-1 space-y-0.5">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            to={`/catalog?category=${cat.slug}&sub=${sub.slug}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {sub.name} ({sub.count.toLocaleString()})
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/manufacturers" className="px-4 py-2.5 text-foreground hover:bg-muted transition-colors">{t("header.manufacturers")}</Link>
          <Link to="/catalog" className="px-4 py-2.5 text-foreground hover:bg-muted transition-colors">{t("header.full_catalog")}</Link>
          <Link to="/new-products" className="px-4 py-2.5 text-foreground hover:bg-muted transition-colors">{t("header.new_products")}</Link>
          <Link to="/resources" className="px-4 py-2.5 text-foreground hover:bg-muted transition-colors">{t("header.resources")}</Link>
          <Link to="/contact" className="px-4 py-2.5 text-foreground hover:bg-muted transition-colors">{t("header.contact")}</Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background p-4 space-y-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalog?category=${cat.slug}`}
              className="block py-2 text-sm font-medium text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <hr className="border-border" />
          <Link to="/manufacturers" className="block py-2 text-sm text-foreground" onClick={() => setMobileMenuOpen(false)}>{t("header.manufacturers")}</Link>
          <Link to="/contact" className="block py-2 text-sm text-foreground" onClick={() => setMobileMenuOpen(false)}>{t("header.contact")}</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
