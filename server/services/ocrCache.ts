import crypto from 'crypto';
import fs from 'fs/promises';
import { storage } from '../storage';

export interface CachedOCRResult {
  documentHash: string;
  extractedText: string;
  ocrConfidence: number;
  pageCount: number;
  metadata: any;
  cachedAt: Date;
}

/**
 * OCR Cache Service
 * Caches OCR results based on document hash to avoid reprocessing identical documents
 * Provides significant cost savings and performance improvements
 */
export class OCRCacheService {
  private memoryCache: Map<string, CachedOCRResult> = new Map();
  private readonly MAX_MEMORY_CACHE_SIZE = 100; // Keep last 100 in memory

  /**
   * Generate a hash for a document file
   * Uses SHA-256 for reliable deduplication
   */
  async generateDocumentHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      console.error('❌ Error generating document hash:', error);
      throw error;
    }
  }

  /**
   * Check if OCR result exists in cache
   * Checks memory cache first, then database
   */
  async getCachedResult(documentHash: string): Promise<CachedOCRResult | null> {
    try {
      // Check memory cache first (fastest)
      if (this.memoryCache.has(documentHash)) {
        console.log('✅ OCR cache hit (memory) - ', documentHash.substring(0, 8));
        return this.memoryCache.get(documentHash)!;
      }

      // Check database cache
      const cached = await storage.getCachedOCR(documentHash);
      if (cached) {
        console.log('✅ OCR cache hit (database) - ', documentHash.substring(0, 8));
        
        // Promote to memory cache
        this.addToMemoryCache(documentHash, cached);
        
        return cached;
      }

      console.log('ℹ️  OCR cache miss - ', documentHash.substring(0, 8));
      return null;
    } catch (error) {
      console.error('❌ Error checking OCR cache:', error);
      return null;
    }
  }

  /**
   * Store OCR result in cache
   * Stores in both memory and database
   */
  async cacheResult(
    documentHash: string,
    extractedText: string,
    ocrConfidence: number,
    pageCount: number,
    metadata: any = {}
  ): Promise<void> {
    try {
      const cachedResult: CachedOCRResult = {
        documentHash,
        extractedText,
        ocrConfidence,
        pageCount,
        metadata,
        cachedAt: new Date(),
      };

      // Store in database
      await storage.cacheOCRResult(cachedResult);

      // Store in memory cache
      this.addToMemoryCache(documentHash, cachedResult);

      console.log('✅ OCR result cached - ', documentHash.substring(0, 8));
    } catch (error) {
      console.error('❌ Error caching OCR result:', error);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Add result to memory cache with size management
   */
  private addToMemoryCache(documentHash: string, result: CachedOCRResult): void {
    // If cache is full, remove oldest entry
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(documentHash, result);
  }

  /**
   * Clear cache entries older than specified days
   * Helps manage storage and keep cache fresh
   */
  async clearOldCache(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await storage.deleteOldCachedOCR(cutoffDate);
      console.log(`🗑️  Deleted ${deleted} old OCR cache entries (older than ${daysOld} days)`);

      return deleted;
    } catch (error) {
      console.error('❌ Error clearing old cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    memoryCacheSize: number;
    dbCacheSize: number;
    totalCachedDocuments: number;
  }> {
    const dbCacheSize = await storage.getOCRCacheCount();
    
    return {
      memoryCacheSize: this.memoryCache.size,
      dbCacheSize,
      totalCachedDocuments: dbCacheSize,
    };
  }

  /**
   * Calculate estimated cost savings from cache
   * Assumes $0.0015 per page for OCR API calls
   */
  async calculateCostSavings(): Promise<{
    cacheHits: number;
    estimatedSavings: number;
    currency: string;
  }> {
    const stats = await storage.getOCRCacheHitStats();
    const COST_PER_PAGE = 0.0015; // Approximate OCR cost per page
    
    const estimatedSavings = stats.totalPagesSaved * COST_PER_PAGE;

    return {
      cacheHits: stats.cacheHits,
      estimatedSavings: Math.round(estimatedSavings * 100) / 100,
      currency: 'USD',
    };
  }
}
