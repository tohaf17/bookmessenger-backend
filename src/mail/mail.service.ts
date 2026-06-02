import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter|null=null;

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  onModuleInit() {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!user || !pass) {
      this.logger.warn('SMTP_USER or SMTP_PASS is missing; email was skipped');
      return;
    }

    this.transporter= nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(this.configService.get<string>('SMTP_PORT') ?? 465),
      secure:
        (this.configService.get<string>('SMTP_SECURE') ?? 'true') === 'true',
      auth: { user, pass },
    });
  }

  async sendNewFollowerNotification({
    to,
    lang,
    data,
  }: {
    to: string;
    lang?: string;
    data: { followerName: string; };
  }): Promise<void> {
    if(!this.transporter){return;}

    const subject = await this.i18n.translate('new-follower.message', {
      lang,
    });
    const text = await this.i18n.translate('new-follower.newFollower', {
      lang,
      args: [data.followerName ],
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM') ?? this.configService.get<string>('SMTP_USER')!,
      to,
      subject,
      text,
    });
  }
}
