import { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LoadingScreen from './components/ui/LoadingScreen';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const CallbackPage = lazy(() => import('./pages/auth/CallbackPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AIDesignerPage = lazy(() => import('./pages/AIDesignerPage'));

// Admin pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminProductsPageNew = lazy(() => import('./pages/admin/AdminProductsPageNew'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminRefundsPage = lazy(() => import('./pages/admin/AdminRefundsPage'));
const ProductFormNew = lazy(() => import('./components/admin/products/ProductFormNew'));

// Help pages
const HelpLayout = lazy(() => import('./pages/help/HelpLayout'));
const HelpPage = lazy(() => import('./app/help/page'));
const ContactUsPage = lazy(() => import('./app/help/contact-us/page'));
const FAQsPage = lazy(() => import('./app/help/faqs/page'));
const ShippingReturnsPage = lazy(() => import('./app/help/shipping-returns/page'));
const JewelryCarePage = lazy(() => import('./app/help/jewelry-care/page'));
const SizeGuidePage = lazy(() => import('./app/help/size-guide/page'));

function App() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [_isAppReady, setIsAppReady] = useState(false);

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    setIsAppReady(true);
  };

  // Show loading screen on initial load
  if (showLoadingScreen) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // Show main app once loading is complete
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Layout><HomePage /></Layout>} />
                    <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
                    <Route path="/products/:category" element={<Layout><ProductsPage /></Layout>} />
                    <Route path="/product/:id" element={<Layout><ProductDetailPage /></Layout>} />
                    <Route path="/cart" element={<Layout><CartPage /></Layout>} />
                    <Route path="/login" element={<Layout><LoginPage /></Layout>} />
                    <Route path="/signup" element={<Layout><SignUpPage /></Layout>} />
                    
                    {/* Auth callback routes */}
                    <Route path="/auth/callback" element={<CallbackPage />} />
                    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                    
                    {/* Protected routes */}
                    <Route 
                      path="/checkout" 
                      element={
                        <Layout>
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        </Layout>
                      } 
                    />
                    <Route 
                      path="/account" 
                      element={
                        <Layout>
                          <ProtectedRoute>
                            <AccountPage />
                          </ProtectedRoute>
                        </Layout>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <Layout>
                          <ProtectedRoute>
                            <AccountPage />
                          </ProtectedRoute>
                        </Layout>
                      } 
                    />
                    <Route 
                      path="/wishlist" 
                      element={
                        <Layout>
                          <ProtectedRoute>
                            <WishlistPage />
                          </ProtectedRoute>
                        </Layout>
                      } 
                    />
                    
                    {/* AI Designer routes */}
                    <Route 
                      path="/ai-designer" 
                      element={
                        <Layout>
                          <AIDesignerPage />
                        </Layout>
                      } 
                    />
                    <Route 
                      path="/ai-designer/:sessionId" 
                      element={
                        <Layout>
                          <ProtectedRoute>
                            <AIDesignerPage />
                          </ProtectedRoute>
                        </Layout>
                      } 
                    />

                    {/* Help Center Routes */}
                    <Route path="/help" element={<HelpLayout><HelpPage /></HelpLayout>} />
                    <Route path="/help/contact-us" element={<HelpLayout><ContactUsPage /></HelpLayout>} />
                    <Route path="/help/faqs" element={<HelpLayout><FAQsPage /></HelpLayout>} />
                    <Route path="/help/shipping-returns" element={<HelpLayout><ShippingReturnsPage /></HelpLayout>} />
                    <Route path="/help/jewelry-care" element={<HelpLayout><JewelryCarePage /></HelpLayout>} />
                    <Route path="/help/size-guide" element={<HelpLayout><SizeGuidePage /></HelpLayout>} />

                    {/* Admin routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="products" element={<AdminProductsPageNew />} />
                      <Route path="products/new" element={<ProductFormNew mode="create" />} />
                      <Route path="products/:id/edit" element={<ProductFormNew mode="edit" />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="refunds" element={<AdminRefundsPage />} />
                      
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                  </Routes>
                </Suspense>
                <Toaster position="top-center" />
              </WishlistProvider>
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </Router>
    </I18nextProvider>
  );
}

export default App;