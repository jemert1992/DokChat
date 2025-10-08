import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';
import { EventEmitter } from 'events';

export interface ProcessingTask {
  id: string;
  type: 'ocr' | 'ai_analysis' | 'entity_extraction' | 'vision_analysis';
  data: any;
  priority: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface ProcessingResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  confidence?: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  successCount: number;
}

export class ParallelProcessingService extends EventEmitter {
  private workerPool: Worker[] = [];
  private taskQueue: ProcessingTask[] = [];
  private activeWorkers: Map<Worker, ProcessingTask> = new Map();
  private maxWorkers: number;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  
  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  private readonly SUCCESS_THRESHOLD = 2;
  
  constructor(maxWorkers?: number) {
    super();
    this.maxWorkers = maxWorkers || Math.max(2, os.cpus().length - 1);
    this.initializeWorkerPool();
  }
  
  private initializeWorkerPool() {
    console.log(`🚀 Initializing parallel processing with ${this.maxWorkers} workers`);
  }
  
  /**
   * OPTIMIZED: Process all tasks in full parallel using Promise.all
   * No sequential loops - max concurrency achieved
   */
  async processInParallel(tasks: ProcessingTask[]): Promise<ProcessingResult[]> {
    const startTime = Date.now();
    
    // Sort tasks by priority
    const sortedTasks = tasks.sort((a, b) => b.priority - a.priority);
    
    console.log(`⚡ Processing ${sortedTasks.length} tasks in FULL PARALLEL (no batching)`);
    
    // Process ALL tasks in parallel using Promise.allSettled
    const taskPromises = sortedTasks.map((task, index) => 
      this.processTaskWithRetry(task, index)
    );
    
    const taskResults = await Promise.allSettled(taskPromises);
    
    // Collect results
    const results: ProcessingResult[] = taskResults.map((taskResult, index) => {
      if (taskResult.status === 'fulfilled') {
        return taskResult.value;
      } else {
        return {
          id: sortedTasks[index].id,
          success: false,
          error: taskResult.reason?.message || 'Unknown error',
          processingTime: 0
        };
      }
    });
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Parallel processing completed: ${successCount}/${results.length} tasks in ${totalTime}ms`);
    
    return results;
  }
  
  /**
   * OPTIMIZED: Process batch in FULL PARALLEL using Promise.all
   * Replaces sequential for loop with concurrent execution
   */
  private async processBatch(batch: ProcessingTask[], batchIndex: number): Promise<ProcessingResult[]> {
    console.log(`🔄 Processing batch ${batchIndex} with ${batch.length} tasks in FULL PARALLEL`);
    
    // Process ALL tasks in batch simultaneously using Promise.all
    const batchPromises = batch.map(async (task) => {
      try {
        // Check circuit breaker
        if (!this.canProcess(task.type)) {
          return {
            id: task.id,
            success: false,
            error: 'Circuit breaker open - service temporarily unavailable',
            processingTime: 0
          };
        }
        
        const startTime = Date.now();
        const result = await this.processTask(task);
        const processingTime = Date.now() - startTime;
        
        // Update circuit breaker on success
        this.recordSuccess(task.type);
        
        // Emit progress event
        this.emit('progress', {
          batchIndex,
          taskId: task.id,
          type: task.type,
          status: 'completed',
          processingTime
        });
        
        return {
          id: task.id,
          success: true,
          result,
          processingTime,
          confidence: result.confidence
        };
        
      } catch (error) {
        // Record failure for circuit breaker
        this.recordFailure(task.type);
        
        // Emit error event
        this.emit('error', {
          batchIndex,
          taskId: task.id,
          type: task.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return {
          id: task.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: 0
        };
      }
    });
    
    // Execute all tasks in batch concurrently
    const results = await Promise.all(batchPromises);
    return results;
  }
  
  /**
   * Process single task with retry logic
   */
  private async processTaskWithRetry(task: ProcessingTask, index: number): Promise<ProcessingResult> {
    try {
      // Check circuit breaker
      if (!this.canProcess(task.type)) {
        return {
          id: task.id,
          success: false,
          error: 'Circuit breaker open - service temporarily unavailable',
          processingTime: 0
        };
      }
      
      const startTime = Date.now();
      const result = await this.processTask(task);
      const processingTime = Date.now() - startTime;
      
      // Update circuit breaker on success
      this.recordSuccess(task.type);
      
      // Emit progress event
      this.emit('progress', {
        taskIndex: index,
        taskId: task.id,
        type: task.type,
        status: 'completed',
        processingTime
      });
      
      return {
        id: task.id,
        success: true,
        result,
        processingTime,
        confidence: result.confidence
      };
      
    } catch (error) {
      // Record failure for circuit breaker
      this.recordFailure(task.type);
      
      // Retry logic with exponential backoff
      if ((task.retryCount || 0) < (task.maxRetries || 3)) {
        const retryCount = (task.retryCount || 0) + 1;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        
        console.log(`🔄 Retrying task ${task.id} (attempt ${retryCount}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.processTaskWithRetry({
          ...task,
          retryCount
        }, index);
      }
      
      // Emit error event
      this.emit('error', {
        taskIndex: index,
        taskId: task.id,
        type: task.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        id: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: 0
      };
    }
  }
  
  private async processTask(task: ProcessingTask): Promise<any> {
    // Simulate actual processing based on task type
    switch (task.type) {
      case 'ocr':
        return this.simulateOCRProcessing(task.data);
      case 'ai_analysis':
        return this.simulateAIAnalysis(task.data);
      case 'entity_extraction':
        return this.simulateEntityExtraction(task.data);
      case 'vision_analysis':
        return this.simulateVisionAnalysis(task.data);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
  
  private async simulateOCRProcessing(data: any): Promise<any> {
    // In production, this would call the actual OCR service
    return {
      text: data.text || 'Extracted text',
      confidence: 0.85 + Math.random() * 0.15,
      language: 'en',
      pages: data.pages || 1
    };
  }
  
  private async simulateAIAnalysis(data: any): Promise<any> {
    // In production, this would call the actual AI service
    return {
      analysis: data.analysis || 'AI analysis result',
      confidence: 0.75 + Math.random() * 0.25,
      insights: [],
      entities: []
    };
  }
  
  private async simulateEntityExtraction(data: any): Promise<any> {
    // In production, this would call the actual entity extraction service
    return {
      entities: data.entities || [],
      confidence: 0.8 + Math.random() * 0.2
    };
  }
  
  private async simulateVisionAnalysis(data: any): Promise<any> {
    // In production, this would call the actual vision service
    return {
      tables: [],
      forms: [],
      signatures: [],
      confidence: 0.7 + Math.random() * 0.3
    };
  }
  
  // Circuit breaker implementation
  private canProcess(serviceType: string): boolean {
    const breaker = this.getCircuitBreaker(serviceType);
    
    if (breaker.state === 'closed') {
      return true;
    }
    
    if (breaker.state === 'open') {
      // Check if recovery timeout has passed
      if (Date.now() - breaker.lastFailureTime > this.RECOVERY_TIMEOUT) {
        breaker.state = 'half-open';
        breaker.successCount = 0;
        return true;
      }
      return false;
    }
    
    // Half-open state - allow limited requests
    return true;
  }
  
  private recordSuccess(serviceType: string) {
    const breaker = this.getCircuitBreaker(serviceType);
    
    if (breaker.state === 'half-open') {
      breaker.successCount++;
      if (breaker.successCount >= this.SUCCESS_THRESHOLD) {
        breaker.state = 'closed';
        breaker.failures = 0;
        console.log(`✅ Circuit breaker for ${serviceType} is now CLOSED`);
      }
    } else if (breaker.state === 'closed') {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }
  
  private recordFailure(serviceType: string) {
    const breaker = this.getCircuitBreaker(serviceType);
    
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failures >= this.FAILURE_THRESHOLD) {
      if (breaker.state !== 'open') {
        breaker.state = 'open';
        console.error(`⚠️ Circuit breaker for ${serviceType} is now OPEN`);
        this.emit('circuit-breaker-open', { serviceType });
      }
    }
  }
  
  private getCircuitBreaker(serviceType: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(serviceType)) {
      this.circuitBreakers.set(serviceType, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
        successCount: 0
      });
    }
    return this.circuitBreakers.get(serviceType)!;
  }
  
  // Cleanup method
  cleanup() {
    this.workerPool.forEach(worker => worker.terminate());
    this.workerPool = [];
    this.activeWorkers.clear();
    this.taskQueue = [];
  }
}
