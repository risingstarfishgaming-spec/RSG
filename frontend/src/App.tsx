import { Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import { isSuperStaffHost } from './utils/staffPortal'

const SiteLayout = lazy(() => import('./components/layout/SiteLayout'))
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
      className="flex min-h-dvh items-center justify-center bg-[#0a0a0b]"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
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
        toastOptions={{ duration: 3500 }}
      />
      <Suspense fallback={<PageLoader />}>
        {isSuperStaffHost() ? (
          <SuperStaffRoutes />
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
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        )}
      </Suspense>
    </BrowserRouter>
  )
}
