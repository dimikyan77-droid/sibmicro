import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import logo from "@/assets/logo.png";

const Footer = () => {
  const { lang } = useI18n();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Column 1: Logo + Description */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="SibMicro" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight">SibMicro</span>
          </div>
          <p className="text-sm text-primary-foreground/60 leading-relaxed max-w-xs">
            {lang === "ru"
              ? "SibMicro — Дистрибуция электронных компонентов"
              : "SibMicro — Electronic Components Distribution"}
          </p>
        </div>

        {/* Column 2: Navigation */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/40 mb-4">
            {lang === "ru" ? "Навигация" : "Navigation"}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/catalog" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                {lang === "ru" ? "Поиск компонентов" : "Component Search"}
              </Link>
            </li>
            <li>
              <Link to="/manufacturers" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                {lang === "ru" ? "Поставщики" : "Suppliers"}
              </Link>
            </li>
            <li>
              <Link to="/resources" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                {lang === "ru" ? "О компании" : "About"}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                {lang === "ru" ? "Контакты" : "Contacts"}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/40 mb-4">
            {lang === "ru" ? "Контакты" : "Contact"}
          </h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/70">
            <li>{lang === "ru" ? "Москва, ул. Грайвороновская, 23" : "Moscow, Graivoronovskaya street 23"}</li>
            <li>
              <a href="mailto:main@sibmicro.ru" className="hover:text-primary-foreground transition-colors">
                main@sibmicro.ru
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container py-5 text-xs text-primary-foreground/40 text-center">
          © SibMicro
        </div>
      </div>
    </footer>
  );
};

export default Footer;
