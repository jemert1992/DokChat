import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

/**
 * SPEED OPTIMIZATION: Hot Start and Persistent Sessions
 * Keeps warm LLM connections to eliminate cold start delays
 */
export class WarmSessionManager {
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenAI | null = null;
  private openai: OpenAI | null = null;
  
  private warmSessions = {
    claude: false,
    gemini: false,
    openai: false
  };
  
  private heartbeatIntervals: NodeJS.Timeout[] = [];
  
  constructor() {
    this.initializeClients();
    this.startWarmingSessions();
  }
  
  private initializeClients() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
    
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiKey });
    }
    
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }
  
  /**
   * TACTIC 1: Preload model endpoints on app start
   * Fire test prompts to keep containers loaded
   */
  async startWarmingSessions() {
    console.log('🔥 Starting warm session preloading...');
    
    const warmupPromises = [];
    
    if (this.anthropic) {
      warmupPromises.push(this.warmClaude());
    }
    
    if (this.gemini) {
      warmupPromises.push(this.warmGemini());
    }
    
    if (this.openai) {
      warmupPromises.push(this.warmOpenAI());
    }
    
    await Promise.allSettled(warmupPromises);
    
    // Start heartbeat to keep sessions warm
    this.startHeartbeat();
    
    console.log('✅ All available models warmed and ready');
  }
  
  private async warmClaude() {
    if (!this.anthropic) return;
    
    try {
      console.log('🔥 Warming Claude Sonnet 4.5...');
      await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Ready'
        }]
      });
      this.warmSessions.claude = true;
      console.log('✅ Claude Sonnet 4.5 warmed and ready');
    } catch (error) {
      console.warn('⚠️ Claude warmup failed:', error);
    }
  }
  
  private async warmGemini() {
    if (!this.gemini) return;
    
    try {
      console.log('🔥 Warming Gemini...');
      await this.gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: ['Ready']
      });
      this.warmSessions.gemini = true;
      console.log('✅ Gemini warmed and ready');
    } catch (error) {
      console.warn('⚠️ Gemini warmup failed:', error);
    }
  }
  
  private async warmOpenAI() {
    if (!this.openai) return;
    
    try {
      console.log('🔥 Warming OpenAI...');
      await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Ready' }],
        max_tokens: 50
      });
      this.warmSessions.openai = true;
      console.log('✅ OpenAI warmed and ready');
    } catch (error) {
      console.warn('⚠️ OpenAI warmup failed:', error);
    }
  }
  
  /**
   * TACTIC 2: Heartbeat to keep sessions warm
   * Ping every 3 minutes to prevent cold starts
   */
  private startHeartbeat() {
    // Claude heartbeat every 3 minutes
    if (this.anthropic) {
      const interval = setInterval(async () => {
        try {
          await this.anthropic!.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }]
          });
        } catch (error) {
          console.warn('Claude heartbeat failed');
        }
      }, 60000); // 1 minute (faster heartbeat for better responsiveness)
      this.heartbeatIntervals.push(interval);
    }
    
    // Gemini heartbeat every 1 minute
    if (this.gemini) {
      const interval = setInterval(async () => {
        try {
          await this.gemini!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: ['ping']
          });
        } catch (error) {
          console.warn('Gemini heartbeat failed');
        }
      }, 60000); // 1 minute (faster heartbeat for better responsiveness)
      this.heartbeatIntervals.push(interval);
    }
  }
  
  /**
   * TACTIC 3: Parallel model racing
   * Ping all models, use fastest response
   */
  async raceModels(prompt: string, maxTokens: number = 4000): Promise<{
    text: string;
    model: string;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const races: Promise<{ text: string; model: string; responseTime: number }>[] = [];
    
    // Race all available models
    if (this.anthropic && this.warmSessions.claude) {
      races.push(
        this.anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        }).then(response => ({
          text: response.content[0].type === 'text' ? response.content[0].text : '',
          model: 'claude-sonnet-4-5',
          responseTime: Date.now() - startTime
        }))
      );
    }
    
    if (this.gemini && this.warmSessions.gemini) {
      races.push(
        this.gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt]
        }).then(result => ({
          text: result.text || '',
          model: 'gemini-2.5-flash',
          responseTime: Date.now() - startTime
        }))
      );
    }
    
    if (this.openai && this.warmSessions.openai) {
      races.push(
        this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens
        }).then(response => ({
          text: response.choices[0]?.message?.content || '',
          model: 'gpt-4',
          responseTime: Date.now() - startTime
        }))
      );
    }
    
    // Return the fastest response
    const winner = await Promise.race(races);
    console.log(`🏁 Model race winner: ${winner.model} (${winner.responseTime}ms)`);
    return winner;
  }
  
  getClients() {
    return {
      anthropic: this.anthropic,
      gemini: this.gemini,
      openai: this.openai
    };
  }
  
  isWarm(model: 'claude' | 'gemini' | 'openai'): boolean {
    return this.warmSessions[model];
  }
  
  cleanup() {
    this.heartbeatIntervals.forEach(interval => clearInterval(interval));
  }
}

// Singleton instance
export const warmSessionManager = new WarmSessionManager();
