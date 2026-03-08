import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { manufacturers } from "@/data/mockData";

const Manufacturers = () => (
  <Layout>
    <div className="bg-muted border-b border-border">
      <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Manufacturers</span>
      </div>
    </div>
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Authorized Manufacturers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manufacturers.map((m) => (
          <Link
            key={m.slug}
            to={`/catalog?q=${encodeURIComponent(m.name)}`}
            className="rounded-lg border border-border bg-card p-6 hover:shadow-md hover:border-accent transition-all"
          >
            <h2 className="text-lg font-bold text-foreground">{m.name}</h2>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{m.description}</p>
            <div className="text-xs text-accent font-semibold mt-3">{m.productCount.toLocaleString()} products</div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {m.featured.map((f) => (
                <span key={f} className="chip chip-info font-mono">{f}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  </Layout>
);

export default Manufacturers;
