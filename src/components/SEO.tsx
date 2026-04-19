import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: "website" | "product" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

const SITE_URL = "https://sibmicro.lovable.app";
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`;
const JSONLD_ID = "seo-jsonld";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const SEO = ({ title, description, canonical, image = DEFAULT_IMAGE, type = "website", jsonLd, noIndex = false }: SEOProps) => {
  useEffect(() => {
    const url = canonical || window.location.href;
    const t = title.length > 60 ? title.slice(0, 57) + "..." : title;
    const d = description.length > 160 ? description.slice(0, 157) + "..." : description;

    document.title = t;
    setMeta('meta[name="description"]', "name", "description", d);
    setLink("canonical", url);

    setMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex,nofollow" : "index,follow");

    setMeta('meta[property="og:type"]', "property", "og:type", type);
    setMeta('meta[property="og:title"]', "property", "og:title", t);
    setMeta('meta[property="og:description"]', "property", "og:description", d);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:image"]', "property", "og:image", image);

    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", t);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", d);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

    const existing = document.getElementById(JSONLD_ID);
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = JSONLD_ID;
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, image, type, jsonLd, noIndex]);

  return null;
};

export default SEO;
