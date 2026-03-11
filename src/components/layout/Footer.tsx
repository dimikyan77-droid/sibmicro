import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="text-lg font-bold tracking-tight mb-3">SibMicro</h3>
          <p className="text-sm text-primary-foreground/60 leading-relaxed">{t("footer.desc")}</p>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4">{t("footer.products")}</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/catalog?category=semiconductors" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.semiconductors")}</Link></li>
            <li><Link to="/catalog?category=passive-components" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.passive")}</Link></li>
            <li><Link to="/catalog?category=rf-microwave" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.rf")}</Link></li>
            <li><Link to="/catalog?category=connectors" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.connectors")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4">{t("footer.services")}</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/quote" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.request_quote")}</Link></li>
            <li><Link to="/bom" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.bom_upload")}</Link></li>
            <li><Link to="/resources" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.tech_resources")}</Link></li>
            <li><Link to="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">{t("footer.contact_sales")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4">{t("footer.contact")}</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/70">
            <li>+7 (495) 123-45-67</li>
            <li>sales@sibmicro.ru</li>
            <li>Moscow, Russia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container py-5 text-xs text-primary-foreground/40 text-center">{t("footer.rights")}</div>
      </div>
    </footer>
  );
};

export default Footer;
