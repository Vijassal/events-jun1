# Events Project Notes

## Project Overview
Event planning application using Next.js, TypeScript, and PostgreSQL.

## Current State
1. Project Setup:
- Next.js 14.1.0 running
- TypeScript and Tailwind CSS configured
- Project located at `/Users/vishaljassal/Desktop/events`
- Configuration files consolidated:
  - next.config.js (removed .ts)
  - tailwind.config.ts (removed .js)
  - postcss.config.js (removed .mjs)
- Development server cleaned up (removed duplicate instances on ports 3001-3003)

2. Database Setup:
- PostgreSQL with Prisma ORM
- Database: events_db
- Models:
  - User (authentication)
  - Profile (user details)
  - Event (event management)

3. Authentication:
- NextAuth.js with credentials provider
- Sign-in and sign-up pages with forms
- Password hashing (bcryptjs)
- User profile creation on signup
- Luxury-themed login page implemented at /auth/login with:
  - Split-screen design
  - Wedding-themed background image
  - Elegant form styling with rose/pink color scheme
  - Email and password fields
  - Remember me functionality
  - Forgot password link
  - Sign up link

4. Environment Configuration:
- DATABASE_URL: PostgreSQL connection
- NEXTAUTH_URL: localhost:3000
- NEXTAUTH_SECRET: Generated and secure

5. File Structure:
- src/app/api/auth/[...nextauth]/route.ts
- src/app/auth/signin/page.tsx
- src/app/auth/signup/page.tsx
- src/app/auth/login/page.tsx (new)
- src/components/auth/SignInForm.tsx
- src/components/auth/SignUpForm.tsx
- public/images/ (new)

## Known Issues
✓ Configuration files consolidated - no more duplicates
✓ Multiple development servers cleaned up

## Next Steps
- Add wedding background image to public/images/
- Implement actual authentication logic
- Create registration page with matching design
- Add form validation

## Important Notes
- This project is focused ONLY on event planning functionality
- All development should be done within the events directory 

# Login Page Implementation - [Current Date]

## Setup & Configuration
- Fixed Next.js configuration issues by converting from TypeScript to JavaScript config
- Set up proper Next.js 14.1.0 app directory structure
- Configured Tailwind CSS with custom amber/gold color palette

## Project Structure
```
events/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx    # Login page with split-screen design
│   │   └── layout.tsx      # Auth layout wrapper
│   ├── globals.css         # Tailwind imports
│   ├── layout.tsx          # Root layout with Inter font
│   └── page.tsx            # Home page (redirects to login)
├── tailwind.config.js      # Tailwind config with amber color palette
└── next.config.js          # Next.js configuration
```

## Features Implemented
1. Split-screen Login Design:
   - Left side: Gold gradient background with app branding
   - Right side: Modern login form
   - Fully responsive layout

2. Form Components:
   - Email input field
   - Password input field
   - Remember me checkbox
   - Forgot password link
   - Sign up link
   - Submit button with hover effects

3. Styling:
   - Custom gold/amber color scheme
   - Modern UI with shadows and rounded corners
   - Smooth hover and focus effects
   - Inter font from Google Fonts

4. Navigation:
   - Auto-redirect from home to login page
   - Sign up link prepared for future implementation

## Development Notes
- Development server runs on port 3001 (or next available port)
- Access login page at: http://localhost:3001/auth/login
- Using Next.js App Router with React Server Components
- Tailwind CSS for styling

## Next Steps
- Implement authentication logic in handleSubmit function
- Create registration page
- Add password recovery functionality
- Set up protected routes
- Implement session management 

## Tailwind CSS Troubleshooting (May 2025)

- Issue: Tailwind utility classes in `src/components` were not being applied, causing layout and styling issues (e.g., Profile button not appearing at the top right).
- Diagnosis: The `content` array in `tailwind.config.js` did not include the `src/components` directory, so Tailwind was not scanning those files for class names.
- Solution: Added `'./src/components/**/*.{js,ts,jsx,tsx,mdx}'` to the `content` array in `tailwind.config.js`.
- Restarted the dev server to ensure Tailwind recompiled with the new paths.
- Result: Tailwind classes in all components are now applied correctly, and the Profile button appears at the top right as intended. 