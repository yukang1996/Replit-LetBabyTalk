# LetBabyTalk

## Overview

LetBabyTalk is a comprehensive React-based web application designed to help parents understand their baby's cries using AI-powered audio analysis. The application provides real-time cry classification, personalized baby profiles, historical tracking, and premium features including chatbot assistance and parenting advice.

## System Architecture

The application follows a modern full-stack architecture with:

- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth and optional guest accounts
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **State Management**: TanStack Query for server state and local React state
- **Audio Processing**: Browser MediaRecorder API with external AI analysis service

## Key Components

### Frontend Architecture
- **Client-side routing** with Wouter for lightweight navigation
- **Component-based UI** using shadcn/ui components built on Radix UI primitives
- **Responsive design** with Tailwind CSS using mobile-first approach
- **Audio recording** capabilities with real-time feedback
- **Internationalization** support for multiple languages (English, Chinese, Arabic, Indonesian)

### Backend Architecture
- **RESTful API** endpoints for all core functionality
- **Session-based authentication** with PostgreSQL session store
- **File upload handling** with Multer for audio files and profile images
- **External AI integration** via HTTP requests to LetBabyTalk analysis service
- **Database migrations** managed through Drizzle Kit

### Database Schema
- **Users table**: Supports both authenticated users and guest accounts with profile information
- **Baby profiles**: Multiple baby profiles per user with demographics and photos
- **Recordings**: Audio files with analysis results and user ratings
- **Cry reason descriptions**: Localized explanations and recommendations
- **Sessions**: Secure session storage for authentication

## Data Flow

1. **User Authentication**: Users can create accounts, sign in, or continue as guests
2. **Baby Profile Creation**: Users set up profiles for their babies with basic information
3. **Audio Recording**: Real-time audio capture with visual feedback and duration tracking
4. **External Analysis**: Audio files sent to AI service for cry classification and probability scores
5. **Results Display**: Classified results shown with explanations and recommendations
6. **Historical Tracking**: All recordings stored with ability to rate accuracy and view trends

## External Dependencies

### Core Dependencies
- **React 18** with TypeScript for frontend development
- **Express.js** for backend API server
- **Drizzle ORM** with PostgreSQL for database operations
- **Passport.js** for authentication strategies
- **TanStack Query** for server state management and caching
- **shadcn/ui** component library for consistent UI design

### Audio and Media
- **Browser MediaRecorder API** for audio capture
- **Multer** for file upload handling
- **Supabase** (optional) for cloud storage of profile images

### External Services
- **LetBabyTalk AI API** (https://api.letbabytalk.com/process_audio) for cry analysis
- **Payment processing** integration ready for subscription management

## Deployment Strategy

The application is designed for deployment on platforms supporting Node.js with the following considerations:

- **Environment variables** for database connections and API keys
- **Build process** that compiles both frontend and backend TypeScript
- **Session storage** requiring persistent PostgreSQL connection
- **File storage** supporting both local filesystem and cloud storage options
- **HTTPS requirement** for audio recording permissions in production

### Build Commands
- Development: `npm run dev` (starts both Vite dev server and Express backend)
- Production build: `npm run build` (compiles frontend and backend)
- Database migrations: `npm run db:push` (applies schema changes)

## Changelog
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.