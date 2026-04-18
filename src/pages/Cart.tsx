import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, CreditCard } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, getUnitPrice } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setPlacing(true);
    const orderNumber = `SM-${Date.now().toString(36).toUpperCase()}`;
    const orderItems = items.map((i) => ({
      productId: i.product.id,
      partNumber: i.product.partNumber,
      manufacturer: i.product.manufacturer,
      quantity: i.quantity,
      unitPrice: getUnitPrice(i.product, i.quantity),
      total: getUnitPrice(i.product, i.quantity) * i.quantity,
    }));

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "pending",
      items: orderItems,
      total_amount: totalPrice,
      currency: "USD",
    });

    if (error) {
      setPlacing(false);
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
      return;
    }

    // Send email notification about the order
    const partNumbersList = orderItems.map((i) => `${i.partNumber} (${i.manufacturer})`).join(", ");
    const quantitiesList = orderItems.map((i) => `${i.partNumber}: ${i.quantity} шт.`).join(", ");
    await supabase.functions.invoke("send-quote-email", {
      body: {
        name: user.email,
        email: user.email,
        partNumbers: partNumbersList,
        quantities: quantitiesList,
        message: `Заказ #${orderNumber}, сумма: $${totalPrice.toFixed(2)}`,
      },
    });

    setPlacing(false);
    clearCart();
    toast({ title: t("cart.order_placed"), description: `${t("account.order_number")}: ${orderNumber}` });
    navigate("/account");
  };

  const formatPrice = (price: number) => `$${price.toFixed(price < 1 ? 4 : 2)}`;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("cart.empty")}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t("cart.empty_desc")}</p>
          <Link to="/catalog">
            <Button variant="default" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t("cart.to_catalog")}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted border-b border-border">
        <div className="container py-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground">{t("catalog.home")}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{t("cart.title")}</span>
        </div>
      </div>

      <div className="container py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t("cart.title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(({ product, quantity }) => {
              const unitPrice = getUnitPrice(product, quantity);
              const lineTotal = unitPrice * quantity;
              return (
                <div key={product.id} className="rounded-lg border border-border bg-card p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <Link to={`/product/${product.id}`} className="text-sm font-semibold font-mono text-primary hover:text-accent hover:underline break-all">
                      {product.partNumber}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.manufacturer} — {product.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("product.unit_price")}: <span className="font-mono font-medium text-foreground">{formatPrice(unitPrice)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      disabled={quantity <= product.moq}
                      className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      min={product.moq}
                      onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || product.moq)}
                      className="w-14 sm:w-16 text-center rounded border border-input bg-background px-1 sm:px-2 py-1 text-sm font-mono"
                    />
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="p-1 rounded border border-border hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-right w-auto sm:w-24 shrink-0 ml-auto sm:ml-0">
                    <div className="text-sm font-bold font-mono">{formatPrice(lineTotal)}</div>
                  </div>

                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">{t("cart.summary")}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("cart.items_count")}</span>
                  <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("cart.positions")}</span>
                  <span>{items.length}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                  <span>{t("account.total")}</span>
                  <span className="font-mono">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Button onClick={handleCheckout} disabled={placing} className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                {user ? t("cart.place_order") : t("cart.login_to_order")}
              </Button>

              {!user && (
                <p className="text-xs text-muted-foreground text-center">{t("cart.login_hint")}</p>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={clearCart}>
              {t("cart.clear")}
            </Button>

            <Link to="/catalog">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" /> {t("cart.continue_shopping")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
