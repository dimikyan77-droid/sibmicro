import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MapPin, ArrowRight } from "lucide-react";
import { REGIONS } from "@/data/regions";

const SITE = "https://sibmicro.lovable.app";

const Regions = () => {
  const canonical = `${SITE}/regions`;
  const title = "Поставка электронных компонентов по регионам России — SibMicro";
  const description =
    "Региональные поставки электронных компонентов SibMicro: Москва, Санкт-Петербург, Новосибирск, Екатеринбург, Казань. Склад, доставка, BOM-загрузка.";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Регионы", item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${canonical}#list`,
      name: "Регионы обслуживания SibMicro",
      itemListElement: REGIONS.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/regions/${r.slug}`,
        name: r.name,
      })),
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
              <BreadcrumbPage>Регионы</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Регионы поставок</h1>
          <p className="text-muted-foreground max-w-3xl">
            SibMicro поставляет электронные компоненты по всей России. Выберите ваш регион,
            чтобы узнать сроки доставки, профильные отрасли и условия работы.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGIONS.map((r) => (
            <Link key={r.slug} to={`/regions/${r.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{r.region}</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 flex items-center justify-between">
                    {r.name}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                  <div className="text-xs text-muted-foreground mt-3">
                    Доставка: {r.deliveryDays}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Regions;
