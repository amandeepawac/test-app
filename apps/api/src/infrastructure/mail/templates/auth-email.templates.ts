export type AuthEmailContent = {
  html: string;
  text: string;
};

type ActionEmailInput = {
  preview: string;
  heading: string;
  message: string;
  buttonText: string;
  actionUrl: string;
  expiry: string;
  securityNote: string;
};

type NoticeEmailInput = {
  preview: string;
  heading: string;
  message: string;
  securityNote: string;
};

const COLORS = {
  page: '#F3F6FA',
  white: '#FFFFFF',
  ink: '#001C40',
  muted: '#5F6B7A',
  line: '#E5EAF0',
  blue: '#003A9B',
  red: '#EA4335',
};

export function createAuthActionEmail(input: ActionEmailInput): AuthEmailContent {
  const html = renderEmail(
    input.preview,
    `
    <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;font-weight:700;color:${COLORS.ink};">
      ${escapeHtml(input.heading)}
    </h1>
    <p style="margin:0 0 26px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${COLORS.muted};">
      ${escapeHtml(input.message)}
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td bgcolor="${COLORS.blue}" style="border-radius:6px;">
          <a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;padding:14px 22px;border:1px solid ${COLORS.blue};border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.2;font-weight:700;color:${COLORS.white};text-decoration:none;">
            ${escapeHtml(input.buttonText)}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${COLORS.muted};">
      Button not working? Copy this link into your browser:
    </p>
    <p style="margin:0 0 24px;overflow-wrap:anywhere;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${COLORS.blue};">
      <a href="${escapeHtml(input.actionUrl)}" style="color:${COLORS.blue};text-decoration:underline;">${escapeHtml(input.actionUrl)}</a>
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="padding:14px 16px;border-left:3px solid ${COLORS.red};background:#FFF7F6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${COLORS.ink};">
          ${escapeHtml(input.expiry)}
        </td>
      </tr>
    </table>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${COLORS.muted};">
      ${escapeHtml(input.securityNote)}
    </p>
  `,
  );

  return {
    html,
    text: `${input.message}\n\n${input.buttonText}: ${input.actionUrl}\n\n${input.expiry}\n\n${input.securityNote}`,
  };
}

export function createAuthNoticeEmail(input: NoticeEmailInput): AuthEmailContent {
  const html = renderEmail(
    input.preview,
    `
    <h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;font-weight:700;color:${COLORS.ink};">
      ${escapeHtml(input.heading)}
    </h1>
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:${COLORS.muted};">
      ${escapeHtml(input.message)}
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0;">
      <tr>
        <td style="padding:14px 16px;border-left:3px solid ${COLORS.red};background:#FFF7F6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${COLORS.ink};">
          ${escapeHtml(input.securityNote)}
        </td>
      </tr>
    </table>
  `,
  );

  return { html, text: `${input.message}\n\n${input.securityNote}` };
}

function renderEmail(preview: string, content: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>RozgarLocal</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preview)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${COLORS.page};">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:${COLORS.white};border:1px solid ${COLORS.line};border-radius:10px;">
            <tr>
              <td style="padding:22px 32px;border-bottom:1px solid ${COLORS.line};">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;font-weight:700;letter-spacing:-.3px;color:${COLORS.ink};">
                  Rozgar<span style="color:${COLORS.red};">Local</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 32px;">
                ${content}
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;text-align:center;color:${COLORS.muted};">
            This is an automated account message from RozgarLocal.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
