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
- **Chat Sessions**: Persistent chat sessions for multi-document analysis with document IDs array
- **Chat Messages**: Individual messages linked to chat sessions for conversation history
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

### Recent Changes (October 2024)

#### Enhanced Landing Page with Google Sign-Up (October 2024)
Completely redesigned landing page with elite-level polish and prominent authentication options:

- **Modern Sign-Up Flow**: Prominent "Start Free Trial" CTA with gradient design
- **Multi-Provider Authentication**: Visual sign-in buttons for Google, GitHub, and Apple
- **Elite-Level Animations**: Framer Motion animations with staggered entrances, hover effects, and smooth transitions
- **Responsive Design**: Adaptive layout across mobile, tablet, and desktop with optimal typography scaling
- **Industry Showcase**: Six beautifully designed industry cards with gradient icons and feature highlights
- **Feature Pills**: Lightning Fast, Enterprise Security, and Team Collaboration highlights
- **Professional Polish**: Gradient backgrounds, shadow effects, and micro-interactions throughout

#### Simplified Industry Dashboards
All four industry dashboards have been redesigned with a streamlined 2-tab structure focused on core document processing and AI chat functionality:

- **Documents & Upload Tab**: Unified document upload zone with real-time document list and processing status
- **AI Assistant Tab**: Intelligent chat interface with industry-specific quick actions for common analysis tasks
  - Medical: Extract patient info, diagnoses, treatment plans, lab results
  - Legal: Extract key clauses, identify risks, compliance checks, contract summaries
  - Finance: Extract amounts, analyze trends, detect anomalies, financial summaries
  - Logistics: Extract tracking info, customs compliance, manifest verification, route analysis

#### Simplified Navigation (December 2024)
Removed all non-functional navigation tabs and streamlined sidebar to essential items only:
- **MAIN Section**: Dashboard link and Industry-specific AI dashboard link
- **DOCUMENTS Section**: Upload Documents (focuses upload zone) and Recent Documents (scrolls to document list)
- **Removed**: All unnecessary tabs including Case Management, Contract Analytics, Property Portfolio, Market Analytics, Clinical Analytics, and dozens of other non-functional navigation items

#### Bulk Document Selection and Chat Persistence (October 2024)
Implemented bulk document analysis capabilities with persistent chat sessions:

- **Multi-Document Selection**: Checkboxes in Finance dashboard allow selecting multiple documents for bulk analysis
- **Persistent Chat Sessions**: Chat conversations are saved to database and automatically restored
  - Sessions are created per unique set of selected documents
  - Messages persist across page refreshes and document reselection
  - Database schema includes `chat_sessions` and `chat_messages` tables
  - API endpoints for creating sessions, saving messages, and retrieving history
- **Smart Session Management**: Automatically loads existing sessions when the same documents are selected
- **Real AI Document Analysis**: Google Gemini 2.5 Flash powered analysis with industry-specific prompts
  - Endpoint: POST `/api/chat/analyze` for real-time document analysis
  - Smart document chunking: First 1500 chars per document for speed
  - Gemini 2.5 Flash for lightning-fast responses (seamlessly integrates with Google Vision OCR)
  - Industry-specific system prompts for finance, medical, legal, logistics
  - **Enhanced Formatting** (October 2024): AI responses now render with:
    - Headers (## syntax) → styled `<h3>` elements for clear sections
    - Bold text (**text**) → `<strong>` for emphasis on key figures
    - Bullet points (• or -) → `<ul>/<li>` for easy scanning
    - Proper paragraph spacing for digestible 2-3 sentence blocks
  - **Larger Chat Interface**: Increased from 300px to 500px height for better readability
- **Chat History Restoration**: Previous conversations with AI responses are restored when reselecting the same document set

#### Performance Optimizations
- Fixed OCR bottleneck: Quick mode now properly limits PDF processing to first 5 pages
- Improved document processing speed with `extractTextQuick` method optimization
- Enhanced routing with both industry-specific and legacy route support
- Resolved PDF processing race condition by creating unique temporary directories per document

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