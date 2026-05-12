import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Download,
  FileText,
  Gift,
  Loader2,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  SmilePlus,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { apiBaseUrl, getAttachmentUrl, getWsBaseUrl, isImageAttachment } from '../../utils/api'
import { linkify } from '../../utils/linkify'
import {
  CHAT_MAX_ATTACHMENT_BYTES,
  CHAT_MORE_EMOJIS,
  CHAT_QUICK_EMOJIS,
  decodeHtmlEntities,
  formatDateDivider,
} from '../../utils/chatUi'

export type UserChatWidgetVariant = 'fab' | 'page'

interface ChatMessage {
  id: string
  userId: string
  senderType: 'user' | 'admin' | 'system'
  message?: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
  attachmentSize?: number
  status: 'unread' | 'read' | 'resolved' | 'sent'
  createdAt: string
  updatedAt: string
  name?: string
  email?: string
  replyTo?: {
    messageId: string
    message?: string
    senderName?: string
    senderType?: string
  }
  reactions?: {
    emoji: string
    reactorId: string
    reactorType: 'user' | 'admin'
    reactorName?: string
  }[]
  metadata?: {
    type?: string
    bonusId?: string
    bonusTitle?: string
    bonusType?: string
    bonusValue?: string
    isSystemMessage?: boolean
    adminAgentName?: string
    recipientName?: string
    source?: string
  }
}

type Props = {
  variant?: UserChatWidgetVariant
}

export function UserChatWidget({ variant = 'fab' }: Props) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = Boolean(token)
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(variant === 'page')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null)
  const [emojiExpanded, setEmojiExpanded] = useState(false)
  const [closingReply, setClosingReply] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isOpenRef = useRef(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [newMsgCount, setNewMsgCount] = useState(0)
  const [isAdminTyping, setIsAdminTyping] = useState(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingEmitRef = useRef(0)
  const initialLoadRef = useRef(true)
  /** Hide floating chat on mobile: bottom nav + /chat cover support (matches Tailwind `md`, 768px). */
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : true,
  )
  const [imageModal, setImageModal] = useState<{ url: string; name: string } | null>(
    null,
  )

  const isAdminOrAgentPage = useMemo(
    () =>
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/agent'),
    [location.pathname],
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const API_BASE = useMemo(() => apiBaseUrl.replace(/\/$/, ''), [])
  const WS_BASE_URL = useMemo(() => getWsBaseUrl(), [])
  const audioContextRef = useRef<AudioContext | null>(null)

  const checkSession = useCallback(() => Boolean(useAuthStore.getState().token), [])

  useEffect(() => {
    if (variant === 'page') setIsOpen(true)
  }, [variant])

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)()
        } catch {
          /* no audio */
        }
      }
    }
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('keydown', initAudio, { once: true })
    document.addEventListener('touchstart', initAudio, { once: true })
    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('keydown', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)()
      }
      const audioContext = audioContextRef.current
      if (audioContext.state === 'suspended') {
        void audioContext.resume()
      }
      const playTone = (
        frequency: number,
        startTime: number,
        duration: number,
      ) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = frequency
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }
      const now = audioContext.currentTime
      playTone(800, now, 0.15)
      playTone(1000, now + 0.15, 0.15)
    } catch {
      /* ignore */
    }
  }, [])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewMsgCount(0)
    setShowScrollBottom(false)
  }, [])

  const handleScrollEvent = useCallback(() => {
    setShowScrollBottom(!isNearBottom())
  }, [isNearBottom])

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg)
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const el = messageRefs.current[messageId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-indigo-400')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-indigo-400')
      }, 2000)
    }
  }, [])

  const emitTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingEmitRef.current < 2000) return
    lastTypingEmitRef.current = now
    socketRef.current?.emit('chat:typing:start')
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:typing:stop')
    }, 3000)
  }, [])

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!token) return
      try {
        await axios.post(
          `${API_BASE}/chat/messages/${messageId}/reactions`,
          { emoji },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          },
        )
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } }
        const msg = ax?.response?.data?.message || 'Failed to react'
        console.error('Reaction error', msg)
        toast.error(msg)
      }
      setEmojiPickerMsgId(null)
    },
    [token, API_BASE],
  )

  useEffect(() => {
    if (!isOpen && variant === 'fab') return
    if (messages.length === 0) return
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        setNewMsgCount(0)
        setShowScrollBottom(false)
      }, 50)
      return
    }
    if (isNearBottom()) scrollToBottom()
    else setNewMsgCount((c) => c + 1)
  }, [messages.length, isOpen, variant, isNearBottom, scrollToBottom])

  useEffect(() => {
    if (!isAuthenticated || !token || isAdminOrAgentPage) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setMessages([])
      return
    }

    const socket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      withCredentials: true,
      autoConnect: true,
    })

    socket.on('connect_error', (err) => {
      console.error('Chat socket connection error', err)
    })

    socket.on('chat:message:new', (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev
        const updated = [...prev, message].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        if (message.senderType === 'admin') {
          playNotificationSound()
          if (!isOpenRef.current) setUnreadCount((c) => c + 1)
        }
        return updated
      })
    })

    socket.on('chat:message:status', (message: ChatMessage) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id ? { ...item, status: message.status } : item,
        ),
      )
    })

    socket.on(
      'chat:reaction:update',
      (data: { messageId: string; reactions: ChatMessage['reactions'] }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m,
          ),
        )
      },
    )

    socket.on('chat:message:updated', (message: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      )
    })

    socket.on('chat:typing:start', (data: { senderType: string }) => {
      if (data.senderType === 'admin') setIsAdminTyping(true)
    })
    socket.on('chat:typing:stop', (data: { senderType: string }) => {
      if (data.senderType === 'admin') setIsAdminTyping(false)
    })

    socketRef.current = socket
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [
    WS_BASE_URL,
    isAuthenticated,
    token,
    isAdminOrAgentPage,
    playNotificationSound,
  ])

  const loadMessages = async () => {
    if (!token) return
    if (!checkSession()) return
    try {
      setIsLoading(true)
      const response = await axios.get(`${API_BASE}/chat/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50, page: 1 },
        withCredentials: true,
      })
      if (response.data.success) {
        const data: ChatMessage[] = response.data.data || []
        setMessages(
          data
            .slice()
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            ),
        )
      }
    } catch (error: unknown) {
      console.error('Failed to load chat messages', error)
      const ax = error as { response?: { status?: number } }
      if (ax.response?.status === 401) return
      if (isOpen || location.pathname === '/chat') {
        toast.error('Unable to load chat history right now.', {
          duration: 3000,
          position: 'top-center',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (
      isOpen &&
      isAuthenticated &&
      token &&
      !isAdminOrAgentPage &&
      messages.length === 0 &&
      !isLoading &&
      checkSession() &&
      variant === 'fab'
    ) {
      void loadMessages()
    }
  }, [isOpen, isAuthenticated, token, isAdminOrAgentPage, variant])

  useEffect(() => {
    if (
      variant === 'page' &&
      isAuthenticated &&
      token &&
      !isAdminOrAgentPage &&
      messages.length === 0 &&
      !isLoading &&
      checkSession()
    ) {
      void loadMessages()
    }
  }, [variant, isAuthenticated, token, isAdminOrAgentPage])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const handleToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to contact support.')
      return
    }
    if (isOpen) {
      setIsClosing(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 250)
    } else {
      setIsOpen(true)
      setUnreadCount(0)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setAttachment(null)
      return
    }
    if (file.size > CHAT_MAX_ATTACHMENT_BYTES) {
      toast.error('File size must be under 10MB.')
      event.target.value = ''
      return
    }
    setAttachment(file)
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          if (file.size > CHAT_MAX_ATTACHMENT_BYTES) {
            toast.error('Pasted image must be under 10MB.')
            return
          }
          setAttachment(file)
          toast.success('Image pasted from clipboard')
        }
        break
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if (!token || sending) return
    if (!checkSession()) {
      logout()
      toast.error('Your session has expired. Please login again to send messages.')
      return
    }
    if (!inputValue.trim() && !attachment) {
      toast.error('Please enter a message or attach a file.')
      return
    }
    try {
      setSending(true)
      const formData = new FormData()
      if (inputValue.trim()) formData.append('message', inputValue.trim())
      if (attachment) formData.append('attachment', attachment)
      if (replyingTo) formData.append('replyToMessageId', replyingTo.id)
      await axios.post(`${API_BASE}/chat/messages`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      })
      setInputValue('')
      setAttachment(null)
      setReplyingTo(null)
      toast.success('Message sent')
    } catch (error: unknown) {
      console.error('Failed to send chat message', error)
      const ax = error as { response?: { status?: number } }
      if (ax.response?.status === 401) {
        logout()
        return
      }
      if (isOpen || location.pathname === '/chat') {
        toast.error('Failed to send message. Please try again.', {
          duration: 3000,
          position: 'top-center',
        })
      }
    } finally {
      setSending(false)
    }
  }

  const userDisplayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user?.email?.split('@')[0] || 'You'

  const isPage = variant === 'page'

  const chatPanelInner = (
    <>
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all ease-out duration-[250ms] ${
          isPage
            ? 'min-h-0 w-full rounded-none border-0 bg-white shadow-none'
            : 'mb-4 max-h-96 w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-96'
        } ${
          isClosing
            ? 'translate-y-4 scale-95 opacity-0'
            : 'translate-y-0 scale-100 opacity-100'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-[#25304A] bg-gradient-to-r from-[#151D31] via-[#1B2540] to-[#151D31] px-4 py-3 text-white">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isPage ? (
              <Link
                to="/"
                className="flex shrink-0 touch-manipulation rounded-lg p-2 text-white/95 hover:bg-white/15 md:p-1.5"
                aria-label="Back to site"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFD54A]">Support Chat</p>
              <p className="truncate text-lg font-semibold">RSG Live Support</p>
            </div>
          </div>
          {variant === 'fab' ? (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white transition-colors hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScrollEvent}
          className={`relative flex-1 overflow-y-auto overscroll-contain bg-gray-50 p-4 ${
            isPage ? 'min-h-0' : 'max-h-96'
          }`}
        >
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      i % 2 === 0
                        ? 'rounded-bl-sm border border-gray-100 bg-white'
                        : 'rounded-br-sm bg-indigo-100'
                    }`}
                  >
                    <div
                      className="mb-1.5 h-2.5 animate-pulse rounded bg-gray-200"
                      style={{ width: `${70 + (i % 3) * 30}px` }}
                    />
                    <div
                      className="h-2.5 animate-pulse rounded bg-gray-200/60"
                      style={{ width: `${50 + (i % 2) * 40}px` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-indigo-500" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">
                Start the conversation and our support team will respond.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isUser = msg.senderType === 'user'
                const isSystem = msg.senderType === 'system'
                const timestamp = formatTime(msg.createdAt)
                const displayName = isUser
                  ? userDisplayName
                  : msg.name || 'Support Team'

                const prev = index > 0 ? messages[index - 1] : null
                const next =
                  index < messages.length - 1 ? messages[index + 1] : null
                const msgDate = new Date(msg.createdAt)
                const prevDate = prev ? new Date(prev.createdAt) : null
                const showDateDivider =
                  !prev || msgDate.toDateString() !== prevDate?.toDateString()
                const isFirstInGroup =
                  showDateDivider ||
                  !prev ||
                  prev.senderType !== msg.senderType ||
                  msgDate.getTime() - (prevDate?.getTime() || 0) > 120000
                const isLastInGroup =
                  !next ||
                  next.senderType !== msg.senderType ||
                  new Date(next.createdAt).getTime() - msgDate.getTime() >
                    120000 ||
                  msgDate.toDateString() !==
                    new Date(next.createdAt).toDateString()

                if (isSystem) {
                  const metaType = msg.metadata?.type || ''
                  const isLoan = metaType.startsWith('loan_')
                  const systemLabel =
                    msg.metadata?.source || (isLoan ? 'Loan System' : 'System')
                  return (
                    <div key={msg.id}>
                      {showDateDivider && (
                        <div className="my-3 flex items-center justify-center">
                          <div className="flex-1 border-t border-gray-200" />
                          <span className="px-3 text-[11px] font-medium text-gray-400">
                            {formatDateDivider(msgDate)}
                          </span>
                          <div className="flex-1 border-t border-gray-200" />
                        </div>
                      )}
                      <div className="my-3 flex justify-center">
                        <div
                          className={`max-w-[90%] rounded-xl border-2 px-4 py-3 shadow-lg ${
                            isLoan
                              ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                              : 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <Gift
                              className={`h-4 w-4 flex-shrink-0 ${isLoan ? 'text-green-600' : 'text-yellow-600'}`}
                            />
                            <span
                              className={`text-xs font-semibold ${isLoan ? 'text-green-800' : 'text-yellow-800'}`}
                            >
                              {systemLabel}
                            </span>
                            <span
                              className={`text-[10px] ${isLoan ? 'text-green-600' : 'text-yellow-600'}`}
                            >
                              •
                            </span>
                            <span
                              className={`text-[10px] ${isLoan ? 'text-green-600' : 'text-yellow-600'}`}
                            >
                              {timestamp}
                            </span>
                          </div>
                          {msg.message && (
                            <p
                              className={`whitespace-pre-wrap break-words text-sm font-medium ${isLoan ? 'text-green-900' : 'text-yellow-900'}`}
                            >
                              {linkify(decodeHtmlEntities(msg.message), {
                                linkClassName: `underline break-all ${isLoan ? 'text-green-800 hover:text-green-900' : 'text-yellow-800 hover:text-yellow-900'}`,
                              })}
                            </p>
                          )}
                          {msg.metadata?.bonusTitle && (
                            <div
                              className={`mt-2 border-t pt-2 ${isLoan ? 'border-green-300' : 'border-yellow-300'}`}
                            >
                              <p
                                className={`text-xs ${isLoan ? 'text-green-700' : 'text-yellow-700'}`}
                              >
                                <span className="font-semibold">Bonus:</span>{' '}
                                {msg.metadata.bonusTitle}
                                {msg.metadata.bonusValue && (
                                  <span className="ml-2">
                                    ({msg.metadata.bonusValue})
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id}>
                    {showDateDivider && (
                      <div className="my-3 flex items-center justify-center">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="px-3 text-[11px] font-medium text-gray-400">
                          {formatDateDivider(msgDate)}
                        </span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>
                    )}
                    <div
                      ref={(el) => {
                        messageRefs.current[msg.id] = el
                      }}
                      className={`group flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up rounded-lg transition-all duration-500 ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                    >
                      <div
                        className={`flex max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="mb-0.5 flex items-center gap-2 px-1 opacity-60 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleReply(msg)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600"
                            title="Reply"
                          >
                            <Reply className="h-3 w-3" />
                            <span>Reply</span>
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setEmojiPickerMsgId(
                                  emojiPickerMsgId === msg.id ? null : msg.id,
                                )
                                setEmojiExpanded(false)
                              }}
                              className="flex items-center text-xs text-gray-400 hover:text-indigo-600"
                              title="React"
                            >
                              <SmilePlus className="h-3 w-3" />
                            </button>
                            {emojiPickerMsgId === msg.id && (
                              <div
                                className={`absolute bottom-full z-[70] mb-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg ${isUser ? 'right-0' : 'left-0'}`}
                              >
                                <div className="flex items-center gap-0.5">
                                  {CHAT_QUICK_EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => toggleReaction(msg.id, emoji)}
                                      className="rounded p-1 text-center text-sm transition-all hover:scale-110 hover:bg-gray-100 active:scale-125"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  {!emojiExpanded && (
                                    <button
                                      type="button"
                                      onClick={() => setEmojiExpanded(true)}
                                      className="rounded p-1 text-xs text-gray-400 transition-all hover:bg-gray-100 hover:text-indigo-600"
                                      title="More emojis"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                                {emojiExpanded && (
                                  <div className="mt-0.5 flex items-center gap-0.5">
                                    {CHAT_MORE_EMOJIS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() =>
                                          toggleReaction(msg.id, emoji)
                                        }
                                        className="rounded p-1 text-center text-sm transition-all hover:scale-110 hover:bg-gray-100 active:scale-125"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isUser
                              ? 'rounded-br-sm bg-indigo-600 text-white'
                              : 'rounded-bl-sm border border-gray-100 bg-white text-gray-900'
                          }`}
                        >
                          {msg.replyTo && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                scrollToMessage(msg.replyTo!.messageId)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  scrollToMessage(msg.replyTo!.messageId)
                                }
                              }}
                              className="mb-2 cursor-pointer rounded-md border-l-2 px-2.5 py-1.5 transition-opacity hover:opacity-80"
                              style={
                                isUser
                                  ? {
                                      backgroundColor: 'rgba(255,255,255,0.15)',
                                      borderColor: 'rgba(255,255,255,0.5)',
                                    }
                                  : {
                                      backgroundColor: 'rgba(99,102,241,0.08)',
                                      borderColor: '#6366F1',
                                    }
                              }
                            >
                              <p
                                className="mb-0.5 text-[10px] font-semibold"
                                style={{
                                  color: isUser
                                    ? 'rgba(255,255,255,0.9)'
                                    : '#6366F1',
                                }}
                              >
                                {msg.replyTo.senderName ||
                                  (msg.replyTo.senderType === 'user'
                                    ? 'You'
                                    : 'Support')}
                              </p>
                              <p
                                className={`line-clamp-2 text-[11px] ${isUser ? 'text-indigo-100' : 'text-gray-500'}`}
                              >
                                {msg.replyTo.message
                                  ? linkify(
                                      decodeHtmlEntities(msg.replyTo.message),
                                      {
                                        linkClassName: `underline break-all ${isUser ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`,
                                      },
                                    )
                                  : '(Attachment)'}
                              </p>
                            </div>
                          )}
                          {isFirstInGroup && (
                            <p className="mb-1 text-xs font-semibold opacity-90">
                              {displayName}
                            </p>
                          )}
                          {msg.message && (
                            <p className="whitespace-pre-wrap break-words text-sm">
                              {linkify(decodeHtmlEntities(msg.message), {
                                linkClassName: `underline break-all ${isUser ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`,
                              })}
                            </p>
                          )}
                          {msg.attachmentUrl && (
                            <div className="mt-3">
                              {isImageAttachment(
                                msg.attachmentType,
                                msg.attachmentName,
                              ) ? (
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() =>
                                    setImageModal({
                                      url: getAttachmentUrl(msg.attachmentUrl!),
                                      name: msg.attachmentName || 'Image',
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setImageModal({
                                        url: getAttachmentUrl(
                                          msg.attachmentUrl!,
                                        ),
                                        name: msg.attachmentName || 'Image',
                                      })
                                    }
                                  }}
                                  className="max-w-full cursor-pointer overflow-hidden rounded-lg sm:max-w-xs"
                                >
                                  <img
                                    src={getAttachmentUrl(msg.attachmentUrl)}
                                    alt="attachment"
                                    className="h-auto max-h-48 w-full rounded-lg object-cover opacity-0 transition-opacity duration-300 sm:max-h-64"
                                    loading="lazy"
                                    onLoad={(e) =>
                                      e.currentTarget.classList.replace(
                                        'opacity-0',
                                        'opacity-100',
                                      )
                                    }
                                  />
                                </div>
                              ) : (
                                <a
                                  href={getAttachmentUrl(msg.attachmentUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 text-sm font-medium underline ${
                                    isUser
                                      ? 'text-indigo-100 hover:text-white'
                                      : 'text-indigo-600 hover:text-indigo-700'
                                  }`}
                                >
                                  <FileText className="h-4 w-4" />
                                  {msg.attachmentName || 'Download attachment'}
                                </a>
                              )}
                            </div>
                          )}
                          {isLastInGroup && (
                            <div
                              className={`mt-2 flex items-center gap-1.5 text-[11px] ${
                                isUser ? 'text-indigo-100' : 'text-gray-500'
                              }`}
                            >
                              <span>{timestamp}</span>
                              {isUser &&
                                (msg.status === 'read' ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-indigo-300" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-indigo-200" />
                                ))}
                              {!isUser && (
                                <span className="ml-auto capitalize">
                                  {msg.status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {Object.entries(
                              msg.reactions.reduce<
                                Record<
                                  string,
                                  {
                                    count: number
                                    reactors: string[]
                                    mine: boolean
                                  }
                                >
                              >((acc, r) => {
                                if (!acc[r.emoji])
                                  acc[r.emoji] = {
                                    count: 0,
                                    reactors: [],
                                    mine: false,
                                  }
                                acc[r.emoji].count++
                                acc[r.emoji].reactors.push(
                                  r.reactorName || r.reactorType,
                                )
                                if (
                                  r.reactorId === user?.id &&
                                  r.reactorType === 'user'
                                )
                                  acc[r.emoji].mine = true
                                return acc
                              }, {}),
                            ).map(([emoji, info]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                                  info.mine
                                    ? 'border-indigo-400 bg-indigo-50'
                                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                }`}
                                title={info.reactors.join(', ')}
                              >
                                <span className="text-xs">{emoji}</span>
                                <span className="text-[10px] text-gray-500">
                                  {info.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {isAdminTyping && (
                <div className="mt-2 flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-gray-400"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-gray-400"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-gray-400"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
          <button
            type="button"
            onClick={scrollToBottom}
            className={`sticky bottom-2 left-1/2 z-10 mx-auto flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${showScrollBottom ? 'pointer-events-auto opacity-90' : 'pointer-events-none opacity-0'}`}
            title="Scroll to latest"
          >
            <ChevronDown className="h-4 w-4 text-indigo-600" />
            {newMsgCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {newMsgCount > 9 ? '9+' : newMsgCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-shrink-0 space-y-3 border-t border-gray-200 bg-white p-4">
          {replyingTo && (
            <div
              className={`flex items-center gap-2 rounded-xl border-l-2 border-indigo-500 bg-indigo-50 px-3 py-2 text-indigo-700 ${closingReply ? 'animate-slide-out-right' : 'animate-slide-up'}`}
            >
              <Reply className="h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {replyingTo.senderType === 'user'
                    ? userDisplayName
                    : replyingTo.name || 'Support'}
                </p>
                <p className="truncate text-xs text-indigo-500">
                  {replyingTo.message
                    ? decodeHtmlEntities(replyingTo.message)
                    : '(Attachment)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClosingReply(true)
                  setTimeout(() => {
                    setReplyingTo(null)
                    setClosingReply(false)
                  }, 200)
                }}
                className="flex-shrink-0 text-indigo-400 hover:text-indigo-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {attachment && (
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="max-w-[180px] truncate">{attachment.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                emitTyping()
              }}
              onPaste={handlePaste}
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Type your message..."
            />
            {inputValue.length > 1500 && (
              <span
                className={`absolute right-2 bottom-1 text-[10px] ${
                  inputValue.length > 1950
                    ? 'text-red-500'
                    : inputValue.length > 1800
                      ? 'text-yellow-500'
                      : 'text-gray-400'
                }`}
              >
                {inputValue.length}/2000
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-transform hover:text-indigo-600 active:scale-95">
              <Paperclip className="h-4 w-4" />
              <span>Attach file</span>
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                onChange={handleFileSelect}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={sending}
              className="inline-flex min-h-12 touch-manipulation items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </div>
      </div>

      {imageModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2 sm:p-4"
          onClick={() => setImageModal(null)}
          role="presentation"
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => setImageModal(null)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/70 p-2 text-white touch-manipulation hover:bg-opacity-90 sm:top-4 sm:right-4 sm:p-3"
              aria-label="Close image"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <a
              href={imageModal.url}
              download={imageModal.name}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-4 bottom-4 z-10 rounded-full bg-black/70 p-2 text-white touch-manipulation hover:bg-opacity-90 sm:right-6 sm:bottom-6 sm:p-3"
              aria-label="Download image"
            >
              <Download className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
            <img
              src={imageModal.url}
              alt={imageModal.name}
              className="max-h-[95dvh] max-w-full object-contain sm:max-h-[90dvh]"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  )

  if (!isAuthenticated || isAdminOrAgentPage) return null

  if (variant === 'page') {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
        {chatPanelInner}
      </div>
    )
  }

  if (isMobile) return null

  return (
    <div className="fixed right-6 bottom-6 z-[60]">
      {(isOpen || isClosing) && chatPanelInner}
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#151D31] via-[#1B2540] to-[#151D31] text-[#FFD54A] shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_24px_rgba(255,213,74,0.18)] ring-1 ring-[#FFD54A]/30 transition-transform hover:scale-105 hover:ring-[#FFD54A]/55 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] animate-bounce-gentle items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default UserChatWidget
