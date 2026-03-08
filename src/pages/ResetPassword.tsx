import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/contexts/I18nContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.password_updated") });
      navigate("/account");
    }
  };

  if (!isRecovery) {
    return (
      <Layout>
        <div className="container max-w-md py-16 text-center text-muted-foreground">
          {t("auth.invalid_link")}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">{t("auth.new_password")}</h1>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="new-password">{t("auth.new_password")}</Label>
              <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{t("auth.update_password")}</Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
