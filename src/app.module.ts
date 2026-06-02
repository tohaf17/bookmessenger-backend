import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { CommentModule } from './comment/comment.module';
import { ReviewModule } from './review/review.module';
import { TrackerModule } from './tracker/tracker.module';
import { TrackerItemModule } from './trackerItem/trackerItem.module';
import { UserBookModule } from './userBook/userBook.module';
import { UserModule } from './user/user.module';
import { I18nModule, AcceptLanguageResolver, HeaderResolver } from 'nestjs-i18n';
import path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      envFilePath: path.join(process.cwd(), '.env'),
      isGlobal: true 
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: Number(configService.get('DATABASE_PORT') ?? 5432),
          username: configService.get<string>('DATABASE_USER'),
          password: String(configService.get('DATABASE_PASSWORD') ?? ''), 
          database: configService.get<string>('DATABASE_NAME'),
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: !isProduction, 
          logging: isProduction ? ['error'] : ['query', 'error'],
        };
      },
    }),

    I18nModule.forRoot({
      fallbackLanguage: 'uk',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['x-lang']), AcceptLanguageResolver],
    }),
    
    UserModule,
    BookModule,
    CommentModule,
    ReviewModule,
    TrackerModule,
    TrackerItemModule,
    UserBookModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}