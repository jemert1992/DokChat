# DOKTECH 3.0 - Multi-Industry Document Intelligence Platform

## Overview
DOKTECH 3.0 is a comprehensive AI-powered document intelligence platform designed for multi-industry use across medical, legal, logistics, finance, and general business sectors. It extracts structured information, performs compliance checks, and generates tailored insights. The platform aims to provide efficient and accurate document processing and analysis, adapting its UI and functionalities based on the user's selected industry.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application features a modern full-stack architecture:
- **Frontend**: React.js with TypeScript, using Vite.
- **Backend**: Express.js with TypeScript on Node.js.
- **Database**: PostgreSQL with Drizzle ORM.

### Authentication & Authorization
Uses Replit's OpenID Connect (OIDC) via Passport.js for session-based user management. User industry selection during onboarding customizes the workspace, and API routes are protected by authentication middleware.

### Database Design
The comprehensive schema supports multi-industry document processing, including tables for Users, Documents, Document Analysis, Extracted Entities, Processing Jobs, Industry Configurations, Chat Sessions, Chat Messages, and Sessions.

### Document Processing Pipeline
A multi-stage pipeline with intelligent AI routing:
1.  **File Upload**: Multer-based handling with validation.
2.  **Intelligent Routing**: Claude Sonnet 4.5 pre-classifies documents (type, complexity, structure) before routing.
    -   **Priority Cascade**: Claude Sonnet 4.5 → Gemini Native → OpenAI GPT-5 → OCR Vision (last resort).
    -   **Smart Fallback**: Cascades to the next AI model *only* on API failures.
3.  **AI Text Extraction**: AI models extract text, preserving structure.
4.  **Entity Extraction**: Industry-specific data extraction.
5.  **Results Storage**: Stores analysis with confidence scoring.

### Intelligent Router Architecture
An advanced AI-first routing system designed to minimize fallback to basic OCR:
-   **Pre-Classification**: Claude Sonnet 4.5 determines document characteristics (type, complexity, tables, charts, handwriting) to recommend optimal processing.
-   **Processing Priority**:
    1.  **Claude Sonnet 4.5**: For complex, nuanced documents requiring multi-step reasoning.
    2.  **Gemini Native**: For native PDFs with embedded text layers, optimized for speed.
    3.  **OpenAI GPT-5**: For structured documents requiring precise entity extraction (e.g., forms, invoices).
    4.  **OCR Vision**: Only used if all other AI models fail, for scanned or image-based documents.
-   **Fallback Logic**: Cascades on API failures with exponential backoff retry logic; OCR is a last resort.

### Frontend Architecture
A component-based React architecture:
-   **UI Components**: Radix UI with shadcn/ui.
-   **State Management**: React Query.
-   **Routing**: Wouter.
-   **Styling**: Tailwind CSS.
-   **Industry Customization**: Dynamic UI adaptation based on user's selected industry.

### Industry-Specific Customization
The platform adapts through configuration-driven customization for:
-   **Medical**: HIPAA-compliant processing, clinical entity extraction.
-   **Legal**: Contract analysis, legal entity recognition.
-   **Logistics**: Multi-language support, customs compliance.
-   **Finance**: Financial entity extraction, fraud detection.
-   **General Business**: Versatile processing for common documents.

### Key Features and Enhancements
-   **Hybrid RAG Pipeline (October 2024)**: Advanced Retrieval-Augmented Generation for long documents with:
    -   **Smart Chunking**: 1-2K token chunks preserving metadata (page numbers, section headers)
    -   **Dual-Filter Retrieval**: BM25 keyword search + Vector semantic reranking (40% BM25 + 60% semantic similarity)
    -   **OpenAI Embeddings**: text-embedding-3-small for semantic understanding with cosine similarity scoring
    -   **Citation-Based Responses**: Claude Sonnet 4.5 generates answers with explicit citations [1][2], confidence scores (0.0-1.0), and self-critique statements to reduce hallucination
    -   **Automatic Activation**: RAG triggered for documents >5K characters (~1.2K tokens) with intelligent fallback to standard chat
-   **Enhanced Landing Page**: Modern design with multi-provider authentication (Google, GitHub, Apple), Framer Motion animations, and responsive layout.
-   **Simplified Industry Dashboards**: Two-tab structure (Documents & Upload, AI Assistant) with industry-specific quick actions.
-   **Streamlined Navigation**: Essential items only: Dashboard, Industry-specific AI dashboard, Upload Documents, Recent Documents.
-   **Bulk Document Selection and Chat Persistence**: Multi-document selection for analysis, persistent chat sessions saved to the database, and intelligent session loading.
-   **Large Document Support**: Increased OCR capacity (up to 250 pages), smart chunking for documents over 15k characters, and relevance-based retrieval.
-   **Performance Optimizations**: Full-parallel processing architecture (Claude Sonnet 4.5 processing entire documents in one API call, true parallel execution with `Promise.all` for all tasks, including batch processing and multi-modal analysis) and parallel batch OCR processing (10 pages simultaneously).
-   **AI Model Upgrade & API Resilience**: Claude 3.5 Sonnet for chat analysis (200K token context, 92% accuracy), with automatic retry logic (exponential backoff) for API reliability. A dual AI system uses Claude for chat and Gemini for quick processing.
-   **Sonnet 4.5 Intelligent Batching (December 2024)**: Revolutionary document processing optimization:
    -   **Long Context Batching**: Leverages Sonnet 4.5's 200K token context window to process multiple pages in single API calls
    -   **Adaptive Planning**: Sonnet analyzes documents and creates optimal processing strategy (batch_process, parallel_process, or sequential_process)
    -   **Self-Evaluation**: Sonnet assesses extraction quality and recommends Vision/OCR fallback only when truly needed (confidence < 0.6)
    -   **Smart Tool Sequencing**: Sonnet identifies parallel execution opportunities and dependencies to minimize processing time
    -   **Efficiency Gains**: Reduces API calls by 60-80% (e.g., 20-page document: 5 calls vs 40+ traditional)
    -   **Metrics Tracking**: Full visibility into batching strategy, API call savings, and self-evaluation decisions
-   **Verification, QA & Feedback Loop (October 2025)**: Comprehensive quality assurance system:
    -   **Auto-QA**: Second-pass validation using Sonnet 4.5 in verification mode to cross-check extracted data
    -   **Uncertainty Threshold**: Automatic flagging for manual review when uncertainty exceeds 30%
    -   **Decision Logging**: Complete trail of Sonnet's reasoning stored in database for debugging and pipeline tuning
    -   **Manual Review Workflow**: UI for human verification with review queue and discrepancy resolution
    -   **Field-Level Confidence**: Tracks confidence scores for each extracted field with detailed discrepancy reasons
    -   **Non-Blocking**: Verification runs automatically but doesn't block document processing if it fails
-   **Sonnet 4.5 Best Practices (October 2025)**: Full implementation of advanced AI optimization:
    -   **Model Selection Priority**: AI-first routing - Sonnet/Gemini vision prioritized over OCR even for scanned docs and images
    -   **Hybrid Retrieval**: BM25 keyword search (40%) + semantic embeddings (60%) for optimal RAG relevance
    -   **Per-Page Transparency**: Page-level confidence reporting with model attribution (which AI processed each page)
    -   **Adaptive Tool Orchestration**: Sonnet self-plans processing strategy (batch/parallel/sequential) dynamically
    -   **Context Window Maximization**: 180K token batching with intelligent grouping to minimize API calls
    -   **Quality Metrics**: Transparent OCR quality scores, AI confidence, and extraction confidence per page
-   **Speed Optimizations (October 2025)**: Revolutionary performance improvements for sub-15s processing:
    -   **Hot Start with Warm LLM Sessions**: Persistent connections to Claude, Gemini, and OpenAI preloaded on app startup
    -   **Model Preloading**: Test prompts sent to all models on startup to keep containers loaded and ready
    -   **Heartbeat Mechanism**: Automatic pings every 3 minutes to prevent cold starts
    -   **Parallel Model Racing**: Fire all available models simultaneously, use the fastest response (Promise.race pattern)
    -   **Low-Latency Failover**: Aggressive 12-second timeout with automatic fallback to OCR on timeout
    -   **Zero Blocking Messages**: Removed all "initializing transformer" messages, show simple progress updates
    -   **Optimized Routing**: Classification and cache checks run in parallel (Promise.all), non-blocking saves
    -   **Fast Mode Default**: Try parallel model racing first, only fall back to traditional routing on failure
    -   **Target Performance**: Sub-15 second processing for standard documents using hot-started AI models

## External Dependencies

### AI & Machine Learning Services
-   **OpenAI API**: GPT-5 for advanced analysis.
-   **Google Cloud Integration (Planned)**: Google Cloud Vision API for OCR, Google Cloud Document AI for document understanding.

### Database & Storage
-   **Neon Database**: Serverless PostgreSQL.
-   **Local File Storage**: Multer-based (future AWS S3 integration planned).

### Authentication
-   **Replit Authentication**: OpenID Connect.
-   **Session Management**: PostgreSQL-based.

### Frontend Dependencies
-   **UI Framework**: Radix UI.
-   **Styling**: Tailwind CSS.
-   **Form Handling**: React Hook Form with Zod.
-   **Data Fetching**: TanStack Query.
-   **Build Tools**: Vite.

### Development & Deployment
-   **TypeScript**: Full-stack type safety.
-   **Drizzle Kit**: Database migrations.
-   **ESBuild**: Fast backend bundling.
-   **Replit Platform**: Integrated development and hosting.