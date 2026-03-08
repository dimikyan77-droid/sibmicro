import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-3">SibMicro</h3>
          <p className="text-sm opacity-80 leading-relaxed">{t("footer.desc")}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t("footer.products")}</h4>
          <ul className="space-y-1.5 text-sm opacity-80">
            <li><Link to="/catalog?category=semiconductors" className="hover:opacity-100">Semiconductors</Link></li>
            <li><Link to="/catalog?category=passive-components" className="hover:opacity-100">Passive Components</Link></li>
            <li><Link to="/catalog?category=rf-microwave" className="hover:opacity-100">RF & Microwave</Link></li>
            <li><Link to="/catalog?category=connectors" className="hover:opacity-100">Connectors</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t("footer.services")}</h4>
          <ul className="space-y-1.5 text-sm opacity-80">
            <li><Link to="/quote" className="hover:opacity-100">{t("footer.request_quote")}</Link></li>
            <li><Link to="/bom" className="hover:opacity-100">{t("footer.bom_upload")}</Link></li>
            <li><Link to="/resources" className="hover:opacity-100">{t("footer.tech_resources")}</Link></li>
            <li><Link to="/contact" className="hover:opacity-100">{t("footer.contact_sales")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">{t("footer.contact")}</h4>
          <ul className="space-y-1.5 text-sm opacity-80">
            <li>📞 +7 (495) 123-45-67</li>
            <li>✉ sales@sibmicro.com</li>
            <li>🏢 Moscow, Russia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="container py-4 text-xs opacity-60 text-center">{t("footer.rights")}</div>
      </div>
    </footer>
  );
};

export default Footer;
