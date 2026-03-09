import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

const Quote = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    partNumbers: "",
    quantities: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.partNumbers) return;

    setLoading(true);
    try {
      // Save to DB
      const { error: dbError } = await supabase.from("quote_requests").insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        company: form.company || null,
        part_numbers: form.partNumbers,
        quantities: form.quantities || null,
        message: form.message || null,
      });

      if (dbError) throw dbError;

      // Try sending email notification
      await supabase.functions.invoke("send-quote-email", {
        body: form,
      });

      toast({
        title: t("quote.success_title"),
        description: t("quote.success_desc"),
      });

      setForm({ name: "", email: "", phone: "", company: "", partNumbers: "", quantities: "", message: "" });
    } catch (err: any) {
      console.error("Quote submit error:", err);
      toast({
        title: t("auth.error"),
        description: err.message || "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-10 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("quote.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("quote.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("quote.name")} *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("quote.phone")}</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t("quote.company")}</label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("quote.part_numbers")} *</label>
            <textarea
              name="partNumbers"
              value={form.partNumbers}
              onChange={handleChange}
              required
              rows={3}
              placeholder={t("quote.part_numbers_hint")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("quote.quantities")}</label>
            <input
              name="quantities"
              value={form.quantities}
              onChange={handleChange}
              placeholder={t("quote.quantities_hint")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("quote.message")}</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t("quote.submit")}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Quote;
