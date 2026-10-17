import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);

  private transporter() {
    if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
    return nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    const subject = 'Reset your SnapNear password';
    const text = [
      'You asked to reset your SnapNear password.',
      '',
      `Open this link (valid for 1 hour):`,
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
      '',
      `— SnapNear (${env.supportEmail})`,
    ].join('\n');

    const html = `
      <p>You asked to reset your SnapNear password.</p>
      <p><a href="${resetUrl}" style="color:#ff8008;font-weight:700">Reset password</a></p>
      <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px">SnapNear · ${env.supportEmail}</p>
    `;

    const transport = this.transporter();
    if (!transport) {
      this.log.warn(`SMTP not configured — password reset link for ${to}: ${resetUrl}`);
      if (env.isProduction) {
        throw new Error('Email is not configured on the server (SMTP_HOST / SMTP_USER / SMTP_PASS)');
      }
      return { sent: false as const, logged: true as const };
    }

    await transport.sendMail({
      from: env.smtp.from || env.smtp.user,
      to,
      subject,
      text,
      html,
    });
    return { sent: true as const, logged: false as const };
  }
}
