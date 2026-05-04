import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CompareProvider } from "@/contexts/CompareContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CompareBar from "@/components/CompareBar";
import Index from "./pages/Index"; // eager — landing page

// Lazy-loaded route chunks
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Manufacturers = lazy(() => import("./pages/Manufacturers"));
const Compare = lazy(() => import("./pages/Compare"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Cart = lazy(() => import("./pages/Cart"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Quote = lazy(() => import("./pages/Quote"));
const Contact = lazy(() => import("./pages/Contact"));
const Resources = lazy(() => import("./pages/Resources"));
const Bom = lazy(() => import("./pages/Bom"));
const Inventory = lazy(() => import("./pages/Inventory"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const NewProducts = lazy(() => import("./pages/NewProducts"));
const CrossReference = lazy(() => import("./pages/CrossReference"));
const Regions = lazy(() => import("./pages/Regions"));
const Region = lazy(() => import("./pages/Region"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/manufacturers" element={<Manufacturers />} />
                    <Route path="/manufacturers/:slug" element={<Manufacturers />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/order/:id" element={<OrderDetail />} />
                    {/* Octopart temporarily disabled — tokens exhausted */}
                    <Route path="/octopart" element={<NotFound />} />
                    <Route path="/quote" element={<Quote />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/bom" element={<Bom />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/new-products" element={<NewProducts />} />
                    <Route path="/cross-reference" element={<CrossReference />} />
                    <Route path="/regions" element={<Regions />} />
                    <Route path="/regions/:slug" element={<Region />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <CompareBar />
              </BrowserRouter>
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
