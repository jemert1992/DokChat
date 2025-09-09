# DOKTECH 3.0 - Multi-Industry Document Intelligence Platform

## Overview

DOKTECH 3.0 is a comprehensive document intelligence platform that provides industry-specific document processing and analysis capabilities across medical, legal, logistics, finance, and general business sectors. The platform leverages AI-powered document analysis to extract structured information, perform compliance checks, and generate insights tailored to each industry's unique requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a modern full-stack architecture with clear separation between frontend and backend components:

- **Frontend**: React.js with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Build System**: Vite for frontend bundling, esbuild for backend compilation

### Authentication & Authorization
Uses Replit's OpenID Connect (OIDC) authentication system with session-based user management:

- Passport.js for authentication middleware
- PostgreSQL session storage with connect-pg-simple
- User industry selection during onboarding for workspace customization
- Protected API routes with authentication middleware

### Database Design
Comprehensive schema supporting multi-industry document processing:

- **Users**: Profile information with industry selection and company details
- **Documents**: File metadata, processing status, and extracted content
- **Document Analysis**: AI-generated insights and extracted data
- **Extracted Entities**: Structured entity extraction results
- **Processing Jobs**: Background task tracking and status management
- **Industry Configurations**: Customizable settings per industry
- **Sessions**: Authentication session management

### Document Processing Pipeline
Multi-stage document processing architecture:

1. **File Upload**: Multer-based file handling with validation and storage
2. **OCR Processing**: Text extraction from various document formats
3. **AI Analysis**: OpenAI GPT-5 integration for intelligent document understanding
4. **Entity Extraction**: Industry-specific data extraction and structuring
5. **Results Storage**: Comprehensive analysis storage with confidence scoring

### Frontend Architecture
Component-based architecture using modern React patterns:

- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **State Management**: React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS variables for theming
- **Industry Customization**: Dynamic UI adaptation based on user's selected industry

### Industry-Specific Customization
Platform adapts to different industries through configuration-driven customization:

- **Medical**: HIPAA-compliant processing with clinical entity extraction
- **Legal**: Contract analysis and legal entity recognition
- **Logistics**: Multi-language document support with customs compliance
- **Finance**: Financial entity extraction with fraud detection capabilities
- **General Business**: Versatile processing for common business documents

Each industry has specific document types, processing rules, UI customizations, and compliance requirements defined in the industry configurations system.

## External Dependencies

### AI & Machine Learning Services
- **OpenAI API**: GPT-5 model for advanced document analysis and natural language processing
- **Planned Google Cloud Integration**: 
  - Google Cloud Vision API for OCR capabilities
  - Google Cloud Document AI for enhanced document understanding

### Database & Storage
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Local File Storage**: Multer-based file handling (designed for future AWS S3 integration)

### Authentication
- **Replit Authentication**: OpenID Connect integration for user authentication
- **Session Management**: PostgreSQL-based session storage

### Frontend Dependencies
- **UI Framework**: Radix UI components for accessible, unstyled primitives
- **Styling**: Tailwind CSS for utility-first styling
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for server state management
- **Build Tools**: Vite for fast development and optimized production builds

### Development & Deployment
- **TypeScript**: Full-stack type safety
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast backend bundling for production
- **Replit Platform**: Integrated development and hosting environment

The architecture is designed for scalability and extensibility, with clear separation of concerns and industry-specific customization capabilities built into the core system design.