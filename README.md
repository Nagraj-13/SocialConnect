# SocialConnect Web Application

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma)](https://prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com/)

A comprehensive social media backend application built with Next.js that allows users to share posts, connect with others, and discover content through a personalized feed experience.

🌐 **Live Demo**: [https://social-connect-orpin-nine.vercel.app/](https://social-connect-orpin-nine.vercel.app/)

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Roles and Permissions](#roles-and-permissions)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based authentication with login/register/logout
- **User Profiles**: Comprehensive profiles with bio, avatar, follower/following counts
- **Content Creation**: Text posts with single image upload capability
- **Social Interactions**: Follow/unfollow users, like posts, comment system
- **Personalized Feed**: Chronological feed showing posts from followed users
- **Real-time Notifications**: Live notifications using Supabase Real-Time Subscriptions
- **Admin Panel**: User management and content oversight

### Key Features
- Email verification for new accounts
- Password reset functionality
- Image upload with validation (JPEG, PNG, max 2MB)
- Privacy controls for user profiles
- Real-time notifications for follows, likes, and comments
- Comprehensive admin management tools

## 🛠 Technology Stack

![Next.js](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=json-web-tokens)
![Supabase](https://img.shields.io/badge/Storage-Supabase-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?logo=tailwind-css)
![pnpm](https://img.shields.io/badge/Package%20Manager-pnpm-F69220?logo=pnpm)

- **Framework**: Next.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Supabase Storage
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Real-time Features**: Supabase Realtime
- **Package Manager**: pnpm

## 📋 Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-v18.0.0+-339933?logo=node.js)
![pnpm](https://img.shields.io/badge/pnpm-v8.0.0+-F69220?logo=pnpm)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)

Before you begin, ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- pnpm (v8.0.0 or higher)
- PostgreSQL database (or Supabase account)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nagraj-13/SocialConnect
   cd Socialconnect
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

## 🔧 Environment Variables

Create a `.env.local` file in the root directory and add the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
# Connect to Supabase via connection pooling
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=2097152  # 2MB in bytes
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
POSTS_PER_PAGE=20

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=P@ssw0rd123
```

### Environment Variables Description

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DATABASE_URL` | PostgreSQL connection string with connection pooling |
| `DIRECT_URL` | Direct PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT token signing |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | Maximum file upload size in bytes |
| `NEXT_PUBLIC_ALLOWED_FILE_TYPES` | Comma-separated list of allowed MIME types |
| `NEXT_PUBLIC_APP_URL` | Base URL of your application |
| `POSTS_PER_PAGE` | Number of posts to display per page |
| `ADMIN_EMAIL` | Default admin email |
| `ADMIN_PASSWORD` | Default admin password |

## 🗄️ Database Setup

1. **Run Prisma migrations**
   ```bash
   pnpm prisma migrate dev
   ```

2. **Generate Prisma client**
   ```bash
   pnpm prisma generate
   ```

3. **Create admin user**
   ```bash
   node scripts/create-admin.mjs
   ```

4. **Seed database (optional)**
   ```bash
   pnpm prisma db seed
   ```

## 🚀 Running the Application

![Development](https://img.shields.io/badge/Mode-Development-yellow)
### Development Mode
```bash
npm run dev
```

![Production](https://img.shields.io/badge/Mode-Production-green)
### Production Build
```bash
pnpm build
pnpm start
```

### Other Useful Commands
```bash
# Run linting
npm run lint

# Run type checking
npm type-check

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

![REST API](https://img.shields.io/badge/API-REST-blue)
![JWT Auth](https://img.shields.io/badge/Auth-JWT-orange)

### Authentication Endpoints
![Public](https://img.shields.io/badge/Access-Public-green)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/password-reset` - Password reset request
- `POST /api/auth/password-reset-confirm` - Password reset confirmation
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/token/refresh` - Refresh access token

### User Management
![Authenticated](https://img.shields.io/badge/Access-Authenticated-blue)

- `GET /api/users/{user_id}` - Get user profile
- `PUT /api/users/me` - Update own profile
- `GET /api/users` - List users (admin only)
- `POST /api/users/{user_id}/follow` - Follow user
- `DELETE /api/users/{user_id}/follow` - Unfollow user
- `GET /api/users/{user_id}/followers` - Get user followers
- `GET /api/users/{user_id}/following` - Get user following

### Posts and Content
![Authenticated](https://img.shields.io/badge/Access-Authenticated-blue)

- `POST /api/posts` - Create post
- `GET /api/posts/{post_id}` - Get post
- `PUT /api/posts/{post_id}` - Update own post
- `DELETE /api/posts/{post_id}` - Delete own post
- `GET /api/posts` - List all posts (paginated)
- `POST /api/posts/{post_id}/like` - Like post
- `DELETE /api/posts/{post_id}/like` - Unlike post
- `GET /api/posts/{post_id}/like-status` - Check like status
- `POST /api/posts/{post_id}/comments` - Add comment
- `GET /api/posts/{post_id}/comments` - Get comments
- `DELETE /api/comments/{comment_id}` - Delete own comment

### Feed System
![Authenticated](https://img.shields.io/badge/Access-Authenticated-blue)

- `GET /api/feed` - Get personalized feed

### Notifications
![Real-time](https://img.shields.io/badge/Feature-Real--time-purple)

- `GET /api/notifications` - Get notifications
- `POST /api/notifications/{notification_id}/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{user_id}` - Get user details
- `POST /api/admin/users/{user_id}/deactivate` - Deactivate user
- `GET /api/admin/posts` - List all posts
- `DELETE /api/admin/posts/{post_id}` - Delete any post
- `GET /api/admin/stats` - Get basic statistics

## 👥 Roles and Permissions

| Feature/Endpoint | User Access | Admin Access |
|-----------------|-------------|--------------|
| Authentication | ✅ Yes | ✅ Yes |
| Create/Edit Own Profile | ✅ Yes | ✅ Yes |
| Create/Delete Own Posts | ✅ Yes | ✅ Yes |
| Follow/Unfollow Users | ✅ Yes | ✅ Yes |
| Like/Comment on Posts | ✅ Yes | ✅ Yes |
| View Public Feeds | ✅ Yes | ✅ Yes |
| User Management | ❌ No | ✅ Yes |
| Delete Any Content | ❌ No | ✅ Yes |
| View All Users List | ❌ No | ✅ Yes |

## 📁 Project Structure

```
Socialconnect/
    
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── admin/
    │   │   └── page.tsx
    │   ├── api/
    │   │   ├── admin/
    │   │   │   ├── posts/
    │   │   │   │   └── route.ts
    │   │   │   └── users/
    │   │   │       ├── route.ts
    │   │   │       └── [id]/
    │   │   │           ├── route.ts
    │   │   │           └── posts/
    │   │   │               └── route.ts
    │   │   ├── notifications/
    │   │   │   ├── route.ts
    │   │   │   ├── [id]/
    │   │   │   │   └── route.ts
    │   │   │   ├── create/
    │   │   │   │   └── route.ts
    │   │   │   ├── list/
    │   │   │   │   └── route.ts
    │   │   │   ├── mark-all-read/
    │   │   │   │   └── route.ts
    │   │   │   └── unread-count/
    │   │   │       └── route.ts
    │   │   ├── posts/
    │   │   │   ├── route.ts
    │   │   │   └── [id]/
    │   │   │       ├── comments/
    │   │   │       │   └── route.ts
    │   │   │       └── like/
    │   │   │           └── route.ts
    │   │   └── users/
    │   │       ├── route.ts
    │   │       ├── create/
    │   │       │   └── route.ts
    │   │       ├── discover/
    │   │       │   └── route.ts
    │   │       ├── follow/
    │   │       │   └── route.ts
    │   │       └── unfollow/
    │   │           └── route.ts
    │   ├── auth/
    │   │   ├── login.tsx
    │   │   ├── page.tsx
    │   │   └── signup.tsx
    │   ├── discover/
    │   │   └── page.tsx
    │   ├── loaders/
    │   │   └── skeletonLoaders.tsx
    │   ├── notifications/
    │   │   └── page.tsx
    │   └── profile/
    │       └── page.tsx
    ├── components/
    │   ├── clientLayout.tsx
    │   ├── Header.tsx
    │   ├── NotificationBell.tsx
    │   ├── SidePannel.tsx
    │   ├── theme-switcher.tsx
    │   ├── update-password-form.tsx
    │   ├── feeds/
    │   │   └── PostFeed.tsx
    │   ├── post/
    │   │   └── createPostDialog.tsx
    │   └── ui/
    │       ├── accordion.tsx
    │       ├── ...
    ├── context/
    │   ├── authContext.tsx
    │   ├── NotificationContext.tsx
    │   └── userContext.tsx
    ├── hooks/
    │   ├── pathnameProvider.tsx
    │   ├── use-mobile.ts
    │   └── useRealTimeNotifications.ts
    ├── lib/
    │   ├── middleware.ts
    │   ├── notifications.ts
    │   ├── prisma.ts
    │   ├── utils.ts
    │   └── supabase/
    │       ├── client.ts
    │       ├── middleware.ts
    │       └── server.ts
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    │       ├── migration_lock.toml
    └── scripts/
    │     └── create-admin.mjs
    ├── README.md
    ├── components.json
    ├── eslint.config.mjs
    ├── middleware.ts
    ├── next.config.ts
    ├── package.json
    ├── pnpm-lock.yaml
    ├── postcss.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── vercel.json
    ├── .env.example

```

## 🤝 Contributing

![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen)

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

![License](https://img.shields.io/badge/License-MIT-blue)

This project is licensed under the MIT License - see the [LICENSE](#mit-license) section below for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core features

---

**Built with ❤️**