# Tangible Nails & Art Studio — Booking System

Full-stack booking and studio management web application built for Tangible Nails & Art Studio, a nail salon based in Chihuahua, Mexico.

## Overview
Tangible is a mobile-first SaaS-style booking platform that allows clients to browse services, select appointment times based on real availability, and confirm bookings via WhatsApp. The studio owner manages appointments, schedules, blocked dates, and reminders through a secure admin dashboard.

## Features
- Service catalog with category accordion (nails, manicure, makeup, eyebrows).
- Real-time availability algorithm based on configurable weekly schedule and blocked dates.
- Client-side localStorage with 90-day expiry and input sanitization.
- WhatsApp-based booking confirmation flow.
- Secure admin dashboard with JWT authentication and bcrypt password hashing.
- Appointment management with cancellation modal and status tracking.
- Daily WhatsApp reminder generation via Vercel Cron Jobs.
- Revenue metrics dashboard with week/month selector.
- QR code generator for in-studio display.
- Anti-bot honeypot field on booking form.
- Security headers including CSP, HSTS, and X-Frame-Options.

## Tech Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Database: MongoDB Atlas via Prisma ORM
- Auth: NextAuth.js with JWT sessions and bcrypt
- Styling: Tailwind CSS
- Validation: Zod
- Deployment: Vercel

## Project Structure
src/
├── app/
│   ├── admin/          # Admin dashboard, schedule, QR pages
│   ├── api/            # REST API routes (bookings, availability, cron)
│   ├── login/          # Admin login page
│   └── page.tsx        # Client-facing booking page
├── components/
│   ├── admin/          # MetricsDashboard
│   ├── bookings/       # ServiceCard, BookingCalendar, ClientForm
│   └── layout/         # MuralDecorations background
├── lib/
│   ├── auth.ts         # NextAuth configuration
│   └── prisma.ts       # Prisma client singleton
└── prisma/
    ├── schema.prisma   # MongoDB schema
    └── seed.ts         # Service catalog seed

## Local Development
1. Clone the repository and install dependencies:
git clone https://github.com/iancorral/Nails_App
cd Nails_App
npm install

2. Create a .env file in the root with the following variables:
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
CRON_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=

3. Generate the Prisma client and seed the service catalog:
npx prisma generate
npx ts-node --project tsconfig.scripts.json prisma/seed.ts

4. Run the development server:
npm run dev

## Security
- NextAuth JWT sessions with 8-hour expiry.
- bcrypt password hashing.
- Double-layer admin protection via middleware and layout.
- Zod validation with ObjectId format checks on all API routes.
- Honeypot anti-bot field on public booking form.
- Content Security Policy and additional security headers.
- Environment variables for all sensitive data.

## License
MIT
