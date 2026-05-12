import { Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import { RequireAuth } from './components/auth/RequireAuth'
import SiteLayout from './components/layout/SiteLayout'
import { isSuperStaffHost } from './utils/staffPortal'
const SuperStaffRoutes = lazy(() => import('./staff/SuperStaffRoutes'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Bonuses = lazy(() => import('./pages/Bonuses'))
const Chat = lazy(() => import('./pages/Chat'))
const Games = lazy(() => import('./pages/Games'))
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Platforms = lazy(() => import('./pages/Platforms'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Register = lazy(() => import('./pages/Register'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Support = lazy(() => import('./pages/Support'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Profile = lazy(() => import('./pages/Profile'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Settings = lazy(() => import('./pages/Settings'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))

function PageLoader() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-[#0B1020]"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-[#FFD54A]" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        containerStyle={{
          top: 'calc(10px + env(safe-area-inset-top, 0px))',
        }}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#151D31',
            color: '#F5F7FA',
            border: '1px solid #25304A',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '14px',
            boxShadow:
              '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 213, 74, 0.04)',
          },
          success: {
            iconTheme: { primary: '#FFD54A', secondary: '#0B1020' },
            style: {
              background: '#151D31',
              color: '#F5F7FA',
              border: '1px solid rgba(255, 213, 74, 0.35)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 24px rgba(255, 213, 74, 0.12)',
            },
          },
          error: {
            iconTheme: { primary: '#F87171', secondary: '#0B1020' },
            style: {
              background: '#151D31',
              color: '#F5F7FA',
              border: '1px solid rgba(248, 113, 113, 0.35)',
            },
          },
          loading: {
            iconTheme: { primary: '#2EC5FF', secondary: '#0B1020' },
            style: {
              background: '#151D31',
              color: '#F5F7FA',
              border: '1px solid rgba(46, 197, 255, 0.35)',
            },
          },
        }}
      />
      {isSuperStaffHost() ? (
        <Suspense fallback={<PageLoader />}>
          <SuperStaffRoutes />
        </Suspense>
      ) : (
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="games" element={<Games />} />
            <Route path="platforms" element={<Platforms />} />
            <Route path="bonuses" element={<Bonuses />} />
            <Route path="chat" element={<Chat />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfService />} />
            <Route path="support" element={<Support />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route
              path="profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  )
}
