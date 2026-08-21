import nodemailer from "nodemailer";

export function getTransporter() {
  const rawHost = process.env.SMTP_HOST;
  const rawUser = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;

  const host = (rawHost || "smtp.gmail.com").trim().replace(/^["']|["']$/g, "");
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.trim(), 10) : 587;
  const user = (rawUser || "").trim().replace(/^["']|["']$/g, "");
  // Gmail App Passwords are 16 characters. Remove any spaces or quotes users might have pasted in Vercel.
  const pass = (rawPass || "").trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");

  const hasSMTP = Boolean(host && user && pass);

  if (!hasSMTP) {
    return { transporter: null, hasSMTP: false, user, host, port };
  }

  const isPort465 = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isPort465, // true for 465, false for 587 or other ports
    auth: { user, pass },
    // Essential for Vercel Serverless Functions:
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false, // Prevents Vercel cloud container SSL handshake drops
    },
  });

  return { transporter, hasSMTP: true, user, host, port };
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { transporter, hasSMTP, user } = getTransporter();

  let rawFrom = process.env.SMTP_FROM
    ? process.env.SMTP_FROM.trim().replace(/^["']|["']$/g, "")
    : `"CampusGo" <${user}>`;

  if (!rawFrom.includes("<") && user) {
    rawFrom = `"${rawFrom}" <${user}>`;
  }

  if (!hasSMTP || !transporter) {
    console.warn(`[EMAIL SKIPPED] SMTP credentials not set on Vercel. Subject: "${subject}" to ${to}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: rawFrom,
      to: to.trim(),
      subject,
      html,
    });
    console.log(`[EMAIL SUCCESS] Sent "${subject}" to ${to}. MessageID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[EMAIL FAILED] Failed sending "${subject}" to ${to}:`, err);
    throw err;
  }
}
