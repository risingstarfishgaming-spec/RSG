import type { Server } from 'socket.io'

let ioInstance: Server | null = null

export function setSocketServerInstance(io: Server): void {
  ioInstance = io
}

/** @throws if Socket.io has not been initialized */
export function getSocketServerInstance(): Server {
  if (!ioInstance) {
    throw new Error('Socket.io server has not been initialized')
  }
  return ioInstance
}

export function tryGetSocketServerInstance(): Server | null {
  return ioInstance
}
