import { OpenAIService } from './openaiService';
import { summarizeArticle as geminiSummarize } from '../../gemini';
import { storage } from '../storage';
import { HybridRAGService, RAGResult, Citation } from './hybridRAGService';

// Use the ChatMessage type from schema instead of defining our own
import type { ChatMessage as ChatMessageDB } from '@shared/schema';

export interface ChatMessage extends Omit<ChatMessageDB, 'createdAt'> {
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  confidence: number;
  model: 'openai' | 'gemini' | 'claude-rag';
  relevantSections: string[];
  citations?: Citation[];
  selfCritique?: string;
}

export class DocumentChatService {
  private openaiService: OpenAIService;
  private ragService: HybridRAGService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.ragService = new HybridRAGService();
  }

  async chatWithDocument(
    documentId: number, 
    userId: string, 
    question: string,
    useRAG: boolean = true
  ): Promise<ChatResponse> {
    try {
      // Get the document and its content
      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== userId) {
        throw new Error('Document not found or access denied');
      }

      // Get recent chat history for context
      const dbChatHistory = await storage.getChatHistory(documentId, 10);
      const chatHistory = dbChatHistory.map(msg => ({
        ...msg,
        timestamp: msg.createdAt || new Date()
      }));

      let finalResponse: ChatResponse;

      // Try RAG-based retrieval first for long documents
      if (useRAG && this.shouldUseRAG(document)) {
        try {
          finalResponse = await this.generateRAGResponse(document, question);
          console.log('✅ Using RAG-based response with citations');
        } catch (ragError) {
          console.warn('RAG failed, falling back to standard chat:', ragError);
          finalResponse = await this.generateStandardResponse(document, question, chatHistory);
        }
      } else {
        finalResponse = await this.generateStandardResponse(document, question, chatHistory);
      }

      // Save the conversation
      await storage.saveChatMessage({
        documentId,
        userId,
        role: 'user',
        content: question
      });

      await storage.saveChatMessage({
        documentId,
        userId,
        role: 'assistant',
        content: finalResponse.response,
        confidence: finalResponse.confidence,
        model: finalResponse.model
      });

      return finalResponse;

    } catch (error) {
      console.error('Error in document chat:', error);
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determine if document should use RAG (for long documents)
   */
  private shouldUseRAG(document: any): boolean {
    const textLength = (document.extractedText || '').length;
    const MIN_LENGTH_FOR_RAG = 5000; // 5K characters (~1.2K tokens)
    return textLength >= MIN_LENGTH_FOR_RAG;
  }

  /**
   * Generate RAG-based response with citations
   */
  private async generateRAGResponse(
    document: any,
    question: string
  ): Promise<ChatResponse> {
    console.log('🔍 Using Hybrid RAG for document query');

    // Check if document is already indexed
    const existingChunks = this.ragService.getDocumentChunks(document.id);
    
    if (!existingChunks) {
      // Index the document first
      console.log('📚 Indexing document for RAG...');
      await this.ragService.indexDocument(
        document.id,
        document.extractedText || '',
        undefined // TODO: Extract page markers if available
      );
    }

    // Query using hybrid RAG
    const ragResult = await this.ragService.query(question, [document.id], 5);

    return {
      response: ragResult.answer,
      confidence: ragResult.confidence,
      model: 'claude-rag',
      relevantSections: ragResult.retrievedChunks.map(chunk => chunk.content.substring(0, 200)),
      citations: ragResult.citations,
      selfCritique: ragResult.selfCritique
    };
  }

  /**
   * Generate standard response using OpenAI/Gemini
   */
  private async generateStandardResponse(
    document: any,
    question: string,
    chatHistory: ChatMessage[]
  ): Promise<ChatResponse> {
    // Generate response using both AI models
    const [openaiResponse, geminiResponse] = await Promise.allSettled([
      this.generateOpenAIResponse(document, question, chatHistory),
      this.generateGeminiResponse(document, question, chatHistory)
    ]);

    // Choose the best response
    if (openaiResponse.status === 'fulfilled' && geminiResponse.status === 'fulfilled') {
      // Compare confidence scores and choose better response
      return openaiResponse.value.confidence >= geminiResponse.value.confidence 
        ? openaiResponse.value 
        : geminiResponse.value;
    } else if (openaiResponse.status === 'fulfilled') {
      return openaiResponse.value;
    } else if (geminiResponse.status === 'fulfilled') {
      return geminiResponse.value;
    } else {
      throw new Error('Both AI models failed to generate response');
    }
  }

  private async generateOpenAIResponse(
    document: any, 
    question: string, 
    chatHistory: ChatMessage[]
  ): Promise<ChatResponse> {
    const contextPrompt = this.buildContextPrompt(document, question, chatHistory);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            {
              role: 'system',
              content: `You are a document analysis assistant. Answer questions about the provided document accurately and concisely. If the information is not in the document, say so clearly.`
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'No response generated';

      return {
        response: content,
        confidence: 0.9,
        model: 'openai',
        relevantSections: this.extractRelevantSections(document.extractedText || '', question)
      };

    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  private async generateGeminiResponse(
    document: any, 
    question: string, 
    chatHistory: ChatMessage[]
  ): Promise<ChatResponse> {
    const contextPrompt = this.buildContextPrompt(document, question, chatHistory);
    
    try {
      const response = await geminiSummarize(contextPrompt);
      
      return {
        response: response || 'No response generated',
        confidence: 0.85,
        model: 'gemini',
        relevantSections: this.extractRelevantSections(document.extractedText || '', question)
      };

    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }

  private buildContextPrompt(document: any, question: string, chatHistory: ChatMessage[]): string {
    let prompt = `Document Information:
Title: ${document.originalFilename}
Industry: ${document.industry || 'Unknown'}
Status: ${document.status}

Document Content:
${document.extractedText || 'No text available'}

`;

    // Add analysis results if available
    if (document.extractedData) {
      prompt += `Previous Analysis Results:
${JSON.stringify(document.extractedData, null, 2)}

`;
    }

    // Add chat history for context
    if (chatHistory.length > 0) {
      prompt += `Previous Conversation:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

`;
    }

    prompt += `Current Question: ${question}

Please provide a helpful and accurate answer based on the document content. If the information is not available in the document, clearly state that.`;

    return prompt;
  }

  private extractRelevantSections(text: string, question: string): string[] {
    // Simple keyword matching to find relevant sections
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    const sentences = text.split(/[.!?]+/);
    
    const relevantSections = sentences.filter(sentence => 
      keywords.some(keyword => sentence.toLowerCase().includes(keyword))
    ).slice(0, 3);

    return relevantSections.map(section => section.trim()).filter(section => section.length > 0);
  }

  async getChatHistory(documentId: number, userId: string): Promise<ChatMessage[]> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== userId) {
        throw new Error('Document not found or access denied');
      }

      const dbHistory = await storage.getChatHistory(documentId);
      return dbHistory.map(msg => ({
        ...msg,
        timestamp: msg.createdAt || new Date()
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async clearChatHistory(documentId: number, userId: string): Promise<void> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== userId) {
        throw new Error('Document not found or access denied');
      }

      await storage.clearChatHistory(documentId);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }
}