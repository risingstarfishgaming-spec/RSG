import { env } from '../config/env.js'

export type PromoAttachment = {
  path: string
  mimetype: string
  originalname: string
}

/**
 * Email-safe brand palette — mirrors `frontend/src/index.css` (@theme tokens)
 * and the cosmic hero from `Home.tsx`. Email clients don't read CSS variables,
 * so values are hard-coded inline below.
 */
const BRAND = {
  bg: '#0B1020',
  bgDeep: '#070B1A',
  card: '#0F1730',
  surface: '#162041',
  border: '#25304A',

  /** Hero cosmic palette (matches .hero-badge-cosmic + HeroBackground). */
  heroBg: '#160A2E',
  heroBgMid: '#1E0F40',
  pillBg: '#1B0E3A',
  pillBorder: '#A98B2E',

  gold: '#FFD54A',
  goldSoft: '#FFE17A',
  goldDeep: '#F59E0B',
  cyan: '#2EC5FF',
  violet: '#A78BFA',
  pink: '#F0ABFC',

  text: '#F5F7FA',
  textMuted: '#A8B0C3',
  textDim: '#6B7280',
}

const BRAND_NAME = 'RSFGaming'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isHttpUrl(raw: string | undefined): raw is string {
  if (!raw) return false
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Brand pill: ★ RSFGAMING ★ in a rounded gold-bordered chip — mirrors the
 * homepage `.hero-badge-cosmic` element. Built with nested tables so it
 * renders identically in Gmail/Outlook (which strip border-radius from inline
 * spans but honour it on table cells).
 */
function brandPill(): string {
  return `
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 22px;">
                <tr>
                  <td bgcolor="${BRAND.pillBg}" style="background-color:${BRAND.pillBg};background-image:linear-gradient(135deg,${BRAND.heroBg} 0%,${BRAND.pillBg} 50%,${BRAND.heroBgMid} 100%);border:1px solid ${BRAND.pillBorder};border-radius:9999px;padding:8px 18px;mso-padding-alt:8px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1;color:${BRAND.gold};vertical-align:middle;">&#9733;</td>
                        <td class="brand-name" style="padding:0 8px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:3.2px;text-transform:uppercase;color:${BRAND.gold};vertical-align:middle;">${BRAND_NAME}</td>
                        <td style="padding:0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1;color:${BRAND.gold};vertical-align:middle;">&#9733;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`
}

/**
 * Bulletproof CTA button (Outlook VML + HTML fallback).
 * Reference: https://buttons.cm/ — Outlook ignores rounded corners + bg
 * gradients on `<a>`, so we draw a VML rounded rect with the same fill.
 */
function ctaButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label)
  const safeHref = escapeHtml(href)
  return `
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
              <tr>
                <td align="center" bgcolor="${BRAND.gold}" style="border-radius:9999px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="${BRAND.gold}">
                    <w:anchorlock/>
                    <center style="color:#0B1020;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;">${safeLabel}</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-- -->
                  <a href="${safeHref}" target="_blank" style="background-color:${BRAND.gold};background-image:linear-gradient(135deg,${BRAND.goldSoft} 0%,${BRAND.gold} 50%,${BRAND.goldDeep} 100%);border-radius:9999px;color:#0B1020;display:inline-block;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:1px;line-height:52px;min-width:200px;padding:0 36px;text-align:center;text-decoration:none;text-transform:uppercase;-webkit-text-size-adjust:none;">${safeLabel}</a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>`
}

export async function buildPromotionalEmailHtml(params: {
  subject: string
  emailBody: string
  headerTitle?: string
  headerSubtitle?: string
  ctaLabel?: string
  ctaUrl?: string
  preheader?: string
  attachment?: PromoAttachment
}): Promise<string> {
  const {
    subject,
    emailBody,
    headerTitle,
    headerSubtitle,
    ctaLabel,
    ctaUrl,
    preheader,
    attachment,
  } = params

  const mainTitle = escapeHtml((headerTitle || `A Message from ${BRAND_NAME}`).trim())
  const emailSubtitle = headerSubtitle?.trim() ? escapeHtml(headerSubtitle.trim()) : ''
  const frontendUrl = env.publicAppUrl.replace(/\/$/, '')
  const siteDomain = escapeHtml(frontendUrl.replace(/^https?:\/\//, ''))
  const currentYear = new Date().getFullYear()
  const safeSubject = escapeHtml(subject || mainTitle)
  const supportEmail = env.brevoReplyTo || env.brevoFromEmail

  /** Preheader: hidden inbox preview text. Padded to push trailing junk away. */
  const preheaderText = escapeHtml(
    (preheader || emailSubtitle || mainTitle).trim().slice(0, 140),
  )
  const preheaderPad =
    '\u00A0&zwnj;'.repeat(120 - Math.min(preheaderText.length, 120))

  const paragraphHtml = escapeHtml(emailBody)
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p class="body-p" style="margin:0 0 18px;color:${BRAND.text};font-size:16px;line-height:1.7;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${block.replace(/\n/g, '<br>')}</p>`,
    )
    .join('')

  const ctaHtml =
    ctaLabel && ctaLabel.trim() && isHttpUrl(ctaUrl)
      ? `
          <tr>
            <td align="center" bgcolor="${BRAND.card}" class="px-md" style="padding:8px 24px 36px;background-color:${BRAND.card};">
              ${ctaButton(ctaLabel.trim(), ctaUrl!)}
            </td>
          </tr>`
      : ''

  /**
   * Attachment reference card. The actual file is delivered through Brevo's
   * native `attachment` field (see `sendPromotionalEmailBatches`) — this card
   * just tells the reader it's there. Embedding files as data-URIs would push
   * the HTML body past Gmail's 102KB clipping threshold.
   */
  let attachmentHtml = ''
  if (attachment) {
    const safeName = escapeHtml(attachment.originalname)
    attachmentHtml = `
          <tr>
            <td align="center" bgcolor="${BRAND.card}" class="px-md" style="padding:0 32px 32px;background-color:${BRAND.card};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.surface}" style="border:1px solid ${BRAND.border};border-radius:10px;background-color:${BRAND.surface};">
                <tr>
                  <td align="left" style="padding:18px 20px;">
                    <p style="margin:0 0 4px;color:${BRAND.textMuted};font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">Attached file</p>
                    <p style="margin:0;color:${BRAND.text};font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;">${safeName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  }

  /**
   * Outlook desktop / Outlook 365 ignore CSS `background-image`. To get the
   * cosmic hero background there too, we draw a VML rect filled with a
   * gradient covering the hero td. Non-Outlook clients ignore the VML and
   * use the CSS gradients instead.
   */
  const outlookHeroBg = `<!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="position:absolute;width:600px;height:260px;top:0;left:0;z-index:-1;mso-position-horizontal-relative:text;mso-position-vertical-relative:text;">
                <v:fill type="gradient" color="${BRAND.heroBg}" color2="${BRAND.bg}" angle="135" />
              </v:rect>
              <![endif]-->`

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" style="background-color:${BRAND.bg};">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>${safeSubject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    html, body { margin:0 !important; padding:0 !important; height:100% !important; width:100% !important; background-color:${BRAND.bg} !important; }
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; display:block; height:auto; max-width:100%; }
    a { color:${BRAND.gold}; text-decoration:none; }
    a:hover { color:${BRAND.goldSoft}; }
    p { margin:0; padding:0; }

    /* Outlook.com (web) dark-mode overrides */
    [data-ogsc] .force-text { color:${BRAND.text} !important; }
    [data-ogsc] .force-muted { color:${BRAND.textMuted} !important; }
    [data-ogsc] .force-gold { color:${BRAND.gold} !important; }
    [data-ogsb] .force-bg { background-color:${BRAND.bg} !important; }
    [data-ogsb] .force-card { background-color:${BRAND.card} !important; }
    [data-ogsb] .force-hero { background-color:${BRAND.heroBg} !important; }

    /* Gmail iOS dark-mode override */
    u + .body .force-text { color:${BRAND.text} !important; }

    /* Mobile (≤620px) */
    @media only screen and (max-width:620px) {
      .container { width:100% !important; max-width:100% !important; border-radius:0 !important; }
      .px-md { padding-left:22px !important; padding-right:22px !important; }
      .hero-pad { padding-top:40px !important; padding-bottom:36px !important; }
      .hero-title { font-size:28px !important; line-height:1.18 !important; }
      .hero-sub { font-size:14px !important; }
      .brand-name { font-size:11px !important; letter-spacing:2.6px !important; }
      .body-p { font-size:15px !important; line-height:1.7 !important; }
      .footer-link { font-size:11px !important; padding:0 6px !important; letter-spacing:1px !important; }
    }
  </style>
</head>
<body class="body force-bg" bgcolor="${BRAND.bg}" style="margin:0;padding:0;width:100%;background-color:${BRAND.bg};font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:${BRAND.text};">

  <!-- Preheader (hidden inbox preview) -->
  <div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheaderText}${preheaderPad}
  </div>

  <!-- 100% wrapper: forces dark page bg even in Gmail's white shell -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.bg}" class="force-bg" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" bgcolor="${BRAND.bg}" style="padding:28px 12px;background-color:${BRAND.bg};">

        <!-- 600px container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" bgcolor="${BRAND.card}" style="width:600px;max-width:600px;background-color:${BRAND.card};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};">

          <!-- Top accent: gold → cyan → violet → pink -->
          <tr>
            <td height="4" bgcolor="${BRAND.gold}" style="height:4px;line-height:4px;font-size:0;background-color:${BRAND.gold};background-image:linear-gradient(90deg,${BRAND.gold} 0%,${BRAND.cyan} 35%,${BRAND.violet} 70%,${BRAND.pink} 100%);">&nbsp;</td>
          </tr>

          <!-- Cosmic hero: solid bgcolor fallback + layered radial gradients + VML for Outlook -->
          <tr>
            <td align="center" bgcolor="${BRAND.heroBg}" class="px-md hero-pad force-hero" style="position:relative;padding:54px 32px 44px;background-color:${BRAND.heroBg};background-image:radial-gradient(circle at 18% 14%,rgba(46,197,255,0.22) 0%,rgba(11,16,32,0) 38%),radial-gradient(circle at 84% 16%,rgba(240,171,252,0.18) 0%,rgba(11,16,32,0) 42%),radial-gradient(circle at 50% 96%,rgba(167,139,250,0.28) 0%,rgba(11,16,32,0) 52%),radial-gradient(circle at 50% 50%,rgba(255,213,74,0.06) 0%,rgba(11,16,32,0) 60%),linear-gradient(160deg,${BRAND.heroBg} 0%,${BRAND.heroBgMid} 45%,${BRAND.bg} 100%);">

              ${outlookHeroBg}

              ${brandPill()}

              <h1 class="hero-title force-gold" style="margin:0;font-family:'Nunito','Inter','Helvetica Neue',Arial,sans-serif;font-size:36px;font-weight:800;line-height:1.16;letter-spacing:-0.4px;color:${BRAND.gold};">
                ${mainTitle}
              </h1>

              ${
                emailSubtitle
                  ? `<p class="hero-sub force-muted" style="margin:14px 0 0;color:${BRAND.textMuted};font-size:16px;line-height:1.55;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${emailSubtitle}</p>`
                  : ''
              }

              <!-- Gold underline -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:24px auto 0;">
                <tr>
                  <td width="56" height="3" bgcolor="${BRAND.gold}" style="width:56px;height:3px;line-height:3px;font-size:0;background-color:${BRAND.gold};border-radius:2px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="${BRAND.card}" class="px-md force-card" style="padding:40px 40px 8px;background-color:${BRAND.card};color:${BRAND.text};">
              ${paragraphHtml}
            </td>
          </tr>

          ${ctaHtml}

          ${attachmentHtml}

          <!-- Divider -->
          <tr>
            <td bgcolor="${BRAND.card}" class="px-md force-card" style="padding:16px 40px 24px;background-color:${BRAND.card};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="1" bgcolor="${BRAND.border}" style="height:1px;line-height:1px;font-size:0;background-color:${BRAND.border};">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="${BRAND.card}" class="px-md force-card" style="padding:0 24px 30px;background-color:${BRAND.card};">

              <p style="margin:0 0 18px;font-family:'Inter',Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.textMuted};">
                <a href="${frontendUrl}/" class="footer-link" style="color:${BRAND.textMuted};text-decoration:none;padding:0 8px;">Home</a>
                <span style="color:${BRAND.border};">&middot;</span>
                <a href="${frontendUrl}/platforms" class="footer-link" style="color:${BRAND.textMuted};text-decoration:none;padding:0 8px;">Platforms</a>
                <span style="color:${BRAND.border};">&middot;</span>
                <a href="${frontendUrl}/bonuses" class="footer-link" style="color:${BRAND.textMuted};text-decoration:none;padding:0 8px;">Bonuses</a>
                <span style="color:${BRAND.border};">&middot;</span>
                <a href="${frontendUrl}/support" class="footer-link" style="color:${BRAND.textMuted};text-decoration:none;padding:0 8px;">Support</a>
              </p>

              <p style="margin:0 0 16px;">
                <a href="${frontendUrl}" style="color:${BRAND.gold};font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.4px;text-decoration:none;">${siteDomain}</a>
              </p>

              <p style="margin:0 0 22px;color:${BRAND.textMuted};font-size:13px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
                Questions? Reply directly or email
                <a href="mailto:${supportEmail}" style="color:${BRAND.gold};font-weight:600;">${escapeHtml(supportEmail)}</a>
              </p>

              <p style="margin:18px 0 0;color:${BRAND.textDim};font-size:11px;line-height:1.6;letter-spacing:0.2px;font-family:'Inter',Arial,sans-serif;">
                &copy; ${currentYear} ${BRAND_NAME}. All rights reserved.<br/>
                Intended for users 18+. Play responsibly.
              </p>

            </td>
          </tr>

          <!-- Bottom cosmic accent -->
          <tr>
            <td height="4" bgcolor="${BRAND.violet}" style="height:4px;line-height:4px;font-size:0;background-color:${BRAND.violet};background-image:linear-gradient(90deg,${BRAND.pink} 0%,${BRAND.violet} 35%,${BRAND.cyan} 70%,${BRAND.gold} 100%);">&nbsp;</td>
          </tr>
        </table>

        <!-- Below container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;">
          <tr>
            <td align="center" style="padding:16px 24px 0;color:${BRAND.textDim};font-family:'Inter',Arial,sans-serif;font-size:11px;line-height:1.6;">
              To stop receiving these emails, contact <a href="mailto:${supportEmail}" style="color:${BRAND.textMuted};">${escapeHtml(supportEmail)}</a>.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}
