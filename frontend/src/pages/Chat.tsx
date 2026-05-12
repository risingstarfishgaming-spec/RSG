import { UserChatWidget } from '../components/chat/UserChatWidget'
import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router'

export default function Chat() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.token))

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {isAuthenticated ? (
        <UserChatWidget variant="page" />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-[#0B1020] px-4 py-12">
          <p className="text-center text-neutral-300">
            <Link
              to="/login"
              className="font-semibold text-[#FFD54A] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to use live chat.
          </p>
        </div>
      )}
    </main>
  )
}
