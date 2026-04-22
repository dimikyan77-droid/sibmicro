import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";

const Contact = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setLoading(true);
    try {
      // Save as a quote request with subject as part_numbers field
      const { error } = await supabase.from("quote_requests").insert({
        name: form.name,
        email: form.email,
        part_numbers: form.subject || "Contact form",
        message: form.message,
      });
      if (error) throw error;

      toast({
        title: t("contact.sent_title"),
        description: t("contact.sent_desc"),
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast({
        title: t("auth.error"),
        description: err.message || "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  const canonical = "https://sibmicro.lovable.app/contact";
  const contactJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "@id": `${canonical}#contactpage`,
      url: canonical,
      name: "Контакты SibMicro",
      description: "Адрес, телефон, email и часы работы SibMicro — поставщика электронных компонентов.",
      inLanguage: "ru-RU",
      isPartOf: { "@id": "https://sibmicro.lovable.app/#website" },
      about: { "@id": "https://sibmicro.lovable.app/#organization" },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      mainEntity: { "@id": "https://sibmicro.lovable.app/#localbusiness" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ElectronicsStore",
      "@id": "https://sibmicro.lovable.app/#localbusiness",
      name: "SibMicro",
      image: "https://sibmicro.lovable.app/icon-512.png",
      logo: "https://sibmicro.lovable.app/icon-512.png",
      url: "https://sibmicro.lovable.app/",
      telephone: "+7 (495) 000-00-00",
      email: "sales@sibmicro.ru",
      priceRange: "₽₽",
      currenciesAccepted: "RUB, USD, EUR",
      paymentAccepted: "Bank transfer, Invoice",
      description:
        "SibMicro — поставщик электронных компонентов: полупроводники, микросхемы, RF-компоненты. Склад в наличии, BOM-загрузка, кросс-референс.",
      parentOrganization: { "@id": "https://sibmicro.lovable.app/#organization" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Пресненская наб., 12",
        addressLocality: "Москва",
        addressRegion: "Москва",
        postalCode: "123112",
        addressCountry: "RU",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 55.749792,
        longitude: 37.539431,
      },
      hasMap: "https://yandex.ru/maps/?ll=37.539431%2C55.749792&z=16&pt=37.539431%2C55.749792",
      areaServed: [
        { "@type": "Country", name: "Russia" },
        { "@type": "Country", name: "Kazakhstan" },
        { "@type": "Country", name: "Belarus" },
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+7-495-000-00-00",
          email: "sales@sibmicro.ru",
          contactType: "sales",
          areaServed: ["RU", "KZ", "BY"],
          availableLanguage: ["Russian", "English"],
        },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
      ],
      sameAs: ["https://sibmicro.lovable.app/"],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t("catalog.home"), item: "https://sibmicro.lovable.app/" },
        { "@type": "ListItem", position: 2, name: t("contact.title"), item: canonical },
      ],
    },
  ];

  return (
    <Layout>
      <SEO
        title="Контакты SibMicro — адрес, телефон, часы работы"
        description="Свяжитесь с SibMicro: адрес офиса в Москве, телефон +7 (495) 123-45-67, email sales@sibmicro.ru. Часы работы пн–пт 09:00–18:00."
        canonical={canonical}
        jsonLd={contactJsonLd}
      />
      <div className="container py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("contact.title")}</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">{t("contact.subtitle")}</p>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left — info + map */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t("contact.info_title")}</h2>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{t("contact.address")}</span>
                    <p className="text-muted-foreground">{t("contact.address_value")}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{t("contact.phone")}</span>
                    <p className="text-muted-foreground">+7 (495) 123-45-67</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{t("contact.email")}</span>
                    <p className="text-muted-foreground">sales@sibmicro.ru</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">{t("contact.hours")}</span>
                    <p className="text-muted-foreground">{t("contact.hours_value")}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Yandex Map — Moscow, Presnenskaya */}
            <div className="rounded-lg overflow-hidden border border-border h-[300px]">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=37.537920%2C55.749580&z=15&pt=37.537920%2C55.749580%2Cpm2rdm"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                title="Office location"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Right — form */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{t("contact.form_title")}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("contact.name")} *</label>
                  <input name="name" value={form.name} onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("contact.subject")}</label>
                <input name="subject" value={form.subject} onChange={handleChange} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("contact.message")} *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t("contact.send")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
