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
      // Render/Gmail hangs forever without these — fail fast so the app shows a real error
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
  }

  private async sendOrThrow(
    transport: NonNullable<ReturnType<MailService['transporter']>>,
    mail: { from: string; to: string; subject: string; text: string; html: string }
  ) {
    try {
      await transport.sendMail(mail);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error(`SMTP send failed to ${mail.to}: ${msg}`);
      throw new Error('Could not send email. Check SMTP settings on the server.');
    }
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

    const transport = this.transporter();
    if (!transport) {
      this.log.warn(`SMTP not configured — signup OTP for ${to}: ${otp}`);
      if (env.isProduction) {
        throw new Error('Email is not configured on the server (SMTP_HOST / SMTP_USER / SMTP_PASS)');
      }
      return { sent: false as const, logged: true as const };
    }

    await this.sendOrThrow(transport, {
      from: env.smtp.from || env.smtp.user,
      to,
      subject,
      text,
      html,
    });
    return { sent: true as const, logged: false as const };
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

    const transport = this.transporter();
    if (!transport) {
      this.log.warn(`SMTP not configured — password reset OTP for ${to}: ${otp}`);
      if (env.isProduction) {
        throw new Error('Email is not configured on the server (SMTP_HOST / SMTP_USER / SMTP_PASS)');
      }
      return { sent: false as const, logged: true as const };
    }

    await this.sendOrThrow(transport, {
      from: env.smtp.from || env.smtp.user,
      to,
      subject,
      text,
      html,
    });
    return { sent: true as const, logged: false as const };
  }
}
