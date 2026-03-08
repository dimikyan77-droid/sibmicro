import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { FileText, Lightbulb, Wrench, ShieldCheck, HelpCircle, ExternalLink, Search } from "lucide-react";

const Resources = () => {
  const { t } = useI18n();

  const sections = [
    { icon: FileText, title: t("res.datasheets"), desc: t("res.datasheets_desc"), color: "text-primary" },
    { icon: Lightbulb, title: t("res.app_notes"), desc: t("res.app_notes_desc"), color: "text-amber-600" },
    { icon: Wrench, title: t("res.design_tools"), desc: t("res.design_tools_desc"), color: "text-blue-600" },
    { icon: ShieldCheck, title: t("res.standards"), desc: t("res.standards_desc"), color: "text-emerald-600" },
    { icon: HelpCircle, title: t("res.faq"), desc: t("res.faq_desc"), color: "text-violet-600" },
  ];

  const links = [
    { name: "Analog Devices", url: "https://www.analog.com/en/resources.html" },
    { name: "Texas Instruments", url: "https://www.ti.com/design-resources/overview.html" },
    { name: "STMicroelectronics", url: "https://www.st.com/content/st_com/en/support/resources.html" },
    { name: "NXP Semiconductors", url: "https://www.nxp.com/design:DESIGN" },
    { name: "Infineon", url: "https://www.infineon.com/cms/en/tools/landing/infineoncommunity.html" },
    { name: "Microchip", url: "https://www.microchip.com/en-us/tools-resources" },
  ];

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("res.title")}</h1>
        <p className="text-muted-foreground mb-10 max-w-3xl">{t("res.subtitle")}</p>

        {/* Search CTA */}
        <Link
          to="/catalog"
          className="mb-10 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-5 hover:bg-primary/10 transition-colors"
        >
          <Search className="h-6 w-6 text-primary shrink-0" />
          <div>
            <span className="font-semibold text-foreground">{t("res.datasheets")}</span>
            <p className="text-sm text-muted-foreground mt-0.5">{t("res.datasheets_desc")}</p>
          </div>
          <span className="ml-auto text-sm font-medium text-primary shrink-0">{t("res.search_catalog")} →</span>
        </Link>

        {/* Resource cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <s.icon className={`h-8 w-8 ${s.color} mb-3`} />
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Useful links */}
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("res.useful_links")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {l.name}
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Resources;
