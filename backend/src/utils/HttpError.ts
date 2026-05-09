export class HttpError extends Error {
  statusCode: number
  /** Returned in JSON as `code` for clients (e.g. EMAIL_NOT_VERIFIED) */
  clientCode?: string

  constructor(statusCode: number, message: string, clientCode?: string) {
    super(message)
    this.statusCode = statusCode
    this.name = 'HttpError'
    if (clientCode) this.clientCode = clientCode
  }
}
