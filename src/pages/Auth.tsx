import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building2, Chrome } from "lucide-react";

const Auth = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regCompany, setRegCompany] = useState("");

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  if (user) {
    navigate("/account");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      navigate("/account");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: regName, company_name: regCompany },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.check_email"), description: t("auth.confirm_sent") });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/account",
    });
    if (result.error) {
      toast({ title: t("auth.error"), description: String(result.error), variant: "destructive" });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.check_email"), description: t("auth.reset_sent") });
      setShowForgot(false);
    }
  };

  if (showForgot) {
    return (
      <Layout>
        <div className="container max-w-md py-16">
          <div className="rounded-lg border border-border bg-card p-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">{t("auth.reset_password")}</h1>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {t("auth.send_reset")}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
                {t("auth.back_login")}
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="rounded-lg border border-border bg-card p-8">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" className="pl-10" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="login-password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type="password" className="pl-10" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{t("auth.login")}</Button>
                <button type="button" className="text-sm text-primary hover:underline w-full text-center" onClick={() => setShowForgot(true)}>
                  {t("auth.forgot_password")}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">{t("auth.full_name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-name" className="pl-10" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-company">{t("auth.company")}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-company" className="pl-10" value={regCompany} onChange={(e) => setRegCompany(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-email" type="email" className="pl-10" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-password" type="password" className="pl-10" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{t("auth.register")}</Button>
              </form>
            </TabsContent>

            <div className="mt-6 pt-6 border-t border-border">
              <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={loading}>
                <Chrome className="h-4 w-4" />
                {t("auth.google")}
              </Button>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
