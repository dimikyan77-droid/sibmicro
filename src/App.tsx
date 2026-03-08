import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompareProvider } from "@/contexts/CompareContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CompareBar from "@/components/CompareBar";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Manufacturers from "./pages/Manufacturers";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import Cart from "./pages/Cart";
import OrderDetail from "./pages/OrderDetail";
import OctopartSearch from "./pages/OctopartSearch";
import Quote from "./pages/Quote";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import Bom from "./pages/Bom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                  <Route path="/octopart" element={<OctopartSearch />} />
                  <Route path="/quote" element={<Quote />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
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
