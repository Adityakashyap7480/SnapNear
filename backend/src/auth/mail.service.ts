import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

type OutboundMail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function parseFrom(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.+?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };
  return { name: 'SnapNear', email: from.trim() };
}

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);

  private fromAddress() {
    return (
      env.resend.from ||
      env.smtp.from ||
      env.smtp.user ||
      `SnapNear <${env.supportEmail}>`
    );
  }

  private hasProvider() {
    return Boolean(
      env.brevo.apiKey ||
        env.resend.apiKey ||
        (env.smtp.host && env.smtp.user && env.smtp.pass)
    );
  }

  private transporter() {
    if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
    return nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
  }

  /** Brevo lets you verify a personal Gmail — From stays your address, over HTTPS. */
  private async sendViaBrevo(mail: OutboundMail) {
    const sender = parseFrom(mail.from);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.brevo.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: mail.to }],
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: mail.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }
  }

  private async sendViaResend(mail: OutboundMail) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mail.from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }
  }

  private async sendOrThrow(mail: OutboundMail) {
    try {
      if (env.brevo.apiKey) {
        await this.sendViaBrevo(mail);
        return;
      }
      if (env.resend.apiKey) {
        await this.sendViaResend(mail);
        return;
      }
      const transport = this.transporter();
      if (!transport) {
        throw new Error('No email provider configured (BREVO_API_KEY / RESEND_API_KEY / SMTP_*)');
      }
      await transport.sendMail(mail);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error(`Email send failed to ${mail.to}: ${msg}`);
      throw new Error('Could not send email. Check email settings on the server.');
    }
  }

  private async deliver(to: string, subject: string, text: string, html: string, otpForDevLog?: string) {
    if (!this.hasProvider()) {
      this.log.warn(`Email not configured — OTP for ${to}${otpForDevLog ? `: ${otpForDevLog}` : ''}`);
      if (env.isProduction) {
        throw new Error('Email is not configured on the server (BREVO_API_KEY / RESEND_API_KEY / SMTP_*)');
      }
      return { sent: false as const, logged: true as const };
    }

    await this.sendOrThrow({
      from: this.fromAddress(),
      to,
      subject,
      text,
      html,
    });
    return { sent: true as const, logged: false as const };
  }

  async sendSignupOtp(to: string, otp: string) {
    const subject = 'Your SnapNear verification code';
    const text = [
      'Verify your SnapNear email to finish creating your account.',
      '',
      `Your code: ${otp}`,
      '',
      'This code expires in 10 minutes. If you did not sign up, ignore this email.',
      '',
      `— SnapNear (${env.supportEmail})`,
    ].join('\n');

    const html = `
      <p>Verify your SnapNear email to finish creating your account.</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:0.35em;color:#0f172a">${otp}</p>
      <p style="color:#64748b;font-size:13px">This code expires in 10 minutes. If you did not sign up, ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px">SnapNear · ${env.supportEmail}</p>
    `;

    return this.deliver(to, subject, text, html, otp);
  }

  async sendPasswordResetOtp(to: string, otp: string) {
    const subject = 'Your SnapNear password reset code';
    const text = [
      'You asked to reset your SnapNear password.',
      '',
      `Your code: ${otp}`,
      '',
      'Enter this code in the SnapNear app. It expires in 10 minutes.',
      'If you did not request this, ignore this email.',
      '',
      `— SnapNear (${env.supportEmail})`,
    ].join('\n');

    const html = `
      <p>You asked to reset your SnapNear password.</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:0.35em;color:#0f172a">${otp}</p>
      <p style="color:#64748b;font-size:13px">Enter this code in the SnapNear app. It expires in 10 minutes. If you did not request this, ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px">SnapNear · ${env.supportEmail}</p>
    `;

    return this.deliver(to, subject, text, html, otp);
  }
}
