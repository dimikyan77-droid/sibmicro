import { useParams, Link, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MapPin, Truck, Clock, Phone, Mail, CheckCircle2, Factory } from "lucide-react";
import { REGIONS, getRegionBySlug } from "@/data/regions";

const SITE = "https://sibmicro.lovable.app";

const Region = () => {
  const { slug } = useParams<{ slug: string }>();
  const region = getRegionBySlug(slug);

  if (!region) return <Navigate to="/regions" replace />;

  const canonical = `${SITE}/regions/${region.slug}`;
  const title = `Электронные компоненты в ${region.name} — поставка от SibMicro`;
  const description = `SibMicro — поставка электронных компонентов в ${region.name} и регионе ${region.region}. Склад в наличии, доставка ${region.deliveryDays}, BOM-загрузка, кросс-референс.`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Регионы", item: `${SITE}/regions` },
        { "@type": "ListItem", position: 3, name: region.name, item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ElectronicsStore",
      "@id": `${canonical}#localbusiness`,
      name: `SibMicro — ${region.name}`,
      url: canonical,
      image: `${SITE}/icon-512.png`,
      logo: `${SITE}/icon-512.png`,
      telephone: "+7 (495) 000-00-00",
      email: "sales@sibmicro.ru",
      priceRange: "₽₽",
      currenciesAccepted: "RUB, USD, EUR",
      paymentAccepted: "Bank transfer, Invoice",
      description,
      parentOrganization: { "@id": `${SITE}/#organization` },
      address: {
        "@type": "PostalAddress",
        addressLocality: region.name,
        addressRegion: region.region,
        postalCode: region.postalCode,
        addressCountry: "RU",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: region.geo.latitude,
        longitude: region.geo.longitude,
      },
      areaServed: [
        {
          "@type": "City",
          name: region.name,
          alternateName: region.nameEn,
          containedInPlace: { "@type": "Country", name: "Russia" },
        },
        {
          "@type": "AdministrativeArea",
          name: region.region,
          containedInPlace: { "@type": "Country", name: "Russia" },
        },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "https://schema.org/Monday",
            "https://schema.org/Tuesday",
            "https://schema.org/Wednesday",
            "https://schema.org/Thursday",
            "https://schema.org/Friday",
          ],
          opens: "09:00:00",
          closes: "18:00:00",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonical}#service`,
      name: `Поставка электронных компонентов в ${region.name}`,
      provider: { "@id": `${SITE}/#organization` },
      areaServed: {
        "@type": "City",
        name: region.name,
        alternateName: region.nameEn,
      },
      serviceType: "Electronic components distribution",
      description,
    },
  ];

  return (
    <Layout>
      <SEO title={title} description={description} canonical={canonical} jsonLd={jsonLd} />

      <div className="container py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Главная</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/regions">Регионы</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{region.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{region.region} · население {region.population}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Электронные компоненты в {region.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{region.description}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild>
              <Link to="/quote">Запросить расчёт</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/catalog">Открыть каталог</Link>
            </Button>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-4 mb-10">
          <Card>
            <CardContent className="pt-6">
              <Truck className="h-6 w-6 text-primary mb-2" />
              <div className="font-semibold">Доставка</div>
              <div className="text-sm text-muted-foreground">{region.deliveryDays} от подтверждения заказа</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Clock className="h-6 w-6 text-primary mb-2" />
              <div className="font-semibold">Часы работы</div>
              <div className="text-sm text-muted-foreground">Пн–Пт, 09:00–18:00 (МСК)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Factory className="h-6 w-6 text-primary mb-2" />
              <div className="font-semibold">Хаб поставок</div>
              <div className="text-sm text-muted-foreground">{region.hubCity}</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-xl font-semibold mb-4">Что мы предлагаем в {region.name}</h2>
            <ul className="space-y-2">
              {region.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Отрасли региона, с которыми работаем</h2>
            <ul className="space-y-2">
              {region.industries.map((h) => (
                <li key={h} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-muted/40 rounded-lg p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4">Контакты для клиентов в {region.name}</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href="tel:+74950000000" className="hover:underline">+7 (495) 000-00-00</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href="mailto:sales@sibmicro.ru" className="hover:underline">sales@sibmicro.ru</a>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Другие регионы</h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.filter((r) => r.slug !== region.slug).map((r) => (
              <Button key={r.slug} asChild variant="outline" size="sm">
                <Link to={`/regions/${r.slug}`}>{r.name}</Link>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Region;
