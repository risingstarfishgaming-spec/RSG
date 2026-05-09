import connectTimeout from 'connect-timeout'
import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server, type Socket } from 'socket.io'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { requestId } from './middleware/requestId.js'
import { adminRouter } from './routes/admin.js'
import { agentRouter } from './routes/agent.js'
import { analyticsPublicRouter } from './routes/analyticsPublic.js'
import { authRouter } from './routes/auth.js'
import { bonusRouter } from './routes/bonus.js'
import { chatUserRouter } from './routes/chatUser.js'
import { healthRouter } from './routes/health.js'
import { platformRouter } from './routes/platform.js'
import { staffAuthRouter } from './routes/staffAuth.js'
import { supportUserRouter } from './routes/supportUser.js'
import { Staff } from './models/Staff.js'
import { User } from './models/User.js'
import { logger } from './utils/logger.js'
import { setSocketServerInstance } from './utils/socketManager.js'
import { verifyAccessToken } from './utils/jwt.js'
import { verifyStaffAccessToken } from './utils/staffJwt.js'

const app = express()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsRoot = path.resolve(__dirname, '../uploads')

app.set('trust proxy', 1)
app.use(requestId)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(connectTimeout(String(env.requestTimeoutMs)))

app.use(
  '/uploads',
  (req, res, next) => {
    const origin = req.headers.origin
    if (
      req.method === 'GET' &&
      origin &&
      env.frontendOrigins.includes(origin)
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    next()
  },
  express.static(uploadsRoot, {
    maxAge: env.nodeEnv === 'production' ? '1d' : 0,
  }),
)

app.use('/api', healthRouter)
/** Common mistake: /health/integrations without /api prefix */
app.get('/health/integrations', (_req, res) => {
  res.redirect(307, '/api/health/integrations')
})
app.use('/api/auth', authRouter)
app.use('/api/staff', staffAuthRouter)
app.use('/api/admin', adminRouter)
app.use('/api/agent', agentRouter)
app.use('/api/analytics', analyticsPublicRouter)
app.use('/api/support', supportUserRouter)
app.use('/api/platforms', platformRouter)
app.use('/api/bonuses', bonusRouter)
app.use('/api/chat', chatUserRouter)

app.use(notFound)
app.use(errorHandler)

async function connectDb() {
  if (!env.mongodbUri) {
    logger.warn('MONGODB_URI not set — skipping MongoDB (set it in backend/.env)')
    return
  }
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 8000,
  })
  logger.info('MongoDB connected')
}

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: env.frontendOrigins,
    credentials: true,
  },
})

setSocketServerInstance(io)

async function broadcastOnlineStaffNames() {
  try {
    const sockets = await io.in('staff').fetchSockets()
    const names = [
      ...new Set(
        sockets
          .map((s) => s.data.staffName as string | undefined)
          .filter((n): n is string => Boolean(n?.trim())),
      ),
    ]
    io.to('staff').emit('chat:agents:online', names)
  } catch {
    /* non-critical */
  }
}

io.use(async (socket, next) => {
  try {
    const auth = socket.handshake.auth as { token?: string; staffToken?: string }
    if (typeof auth.staffToken === 'string') {
      const payload = verifyStaffAccessToken(auth.staffToken)
      const staff = await Staff.findById(payload.sub)
        .select('firstName lastName email')
        .lean()
      socket.data.role = 'staff'
      socket.data.staffId = payload.sub
      socket.data.staffRole = payload.role
      socket.data.staffName = staff
        ? `${staff.firstName} ${staff.lastName}`.trim()
        : payload.email
      return next()
    }
    if (typeof auth.token === 'string') {
      const payload = verifyAccessToken(auth.token)
      const user = await User.findById(payload.sub)
        .select('firstName lastName email')
        .lean()
      if (!user) return next(new Error('Unauthorized'))
      socket.data.role = 'user'
      socket.data.userId = payload.sub
      socket.data.userName =
        `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0]
      return next()
    }
    next(new Error('Unauthorized'))
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket: Socket) => {
  if (socket.data.role === 'staff') {
    socket.join('staff')
    socket.emit('chat:connected', {
      role: 'staff',
      staffName: socket.data.staffName,
    })
    void broadcastOnlineStaffNames()
  } else if (socket.data.userId) {
    socket.join(`user:${socket.data.userId}`)
    socket.emit('chat:connected', {
      role: 'user',
      userId: socket.data.userId,
    })
  }

  socket.on('chat:typing:start', (data?: { userId?: string }) => {
    if (socket.data.role === 'staff' && data?.userId) {
      io.to(`user:${data.userId}`).emit('chat:typing:start', {
        senderType: 'admin',
        name: socket.data.staffName || 'Support',
      })
    } else if (socket.data.userId) {
      io.to('staff').emit('chat:typing:start', {
        senderType: 'user',
        userId: socket.data.userId,
        name: socket.data.userName || 'User',
      })
    }
  })

  socket.on('chat:typing:stop', (data?: { userId?: string }) => {
    if (socket.data.role === 'staff' && data?.userId) {
      io.to(`user:${data.userId}`).emit('chat:typing:stop', {
        senderType: 'admin',
      })
    } else if (socket.data.userId) {
      io.to('staff').emit('chat:typing:stop', {
        senderType: 'user',
        userId: socket.data.userId,
      })
    }
  })

  socket.on('disconnect', () => {
    if (socket.data.role === 'staff') {
      void broadcastOnlineStaffNames()
    } else if (socket.data.userId) {
      io.to('staff').emit('chat:typing:stop', {
        senderType: 'user',
        userId: socket.data.userId,
      })
    }
  })
})

httpServer.listen(env.port, async () => {
  logger.info(`API listening on http://localhost:${env.port}`)
  try {
    await connectDb()
  } catch (e) {
    logger.error('MongoDB connection failed', e)
  }
})

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`)
  io.close(() => {
    httpServer.close(() => {
      mongoose.connection.close().catch(() => {})
      process.exit(0)
    })
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
