import { Router } from 'express';
import { MultiAIService } from './services/multiAIService';
import { OpenAIService } from './services/openaiService';
import { summarizeArticle, analyzeSentiment } from '../gemini';

const router = Router();

// Test data for different industries
const testDocuments = {
  medical: `
    PATIENT: John Smith
    DOB: 01/15/1980
    MRN: 123456789
    DIAGNOSIS: Type 2 Diabetes Mellitus
    MEDICATIONS: Metformin 500mg twice daily, Insulin as needed
    ALLERGIES: Penicillin
    VITAL SIGNS: BP 140/90, Temp 98.6°F, HR 72 bpm
    TREATMENT PLAN: Continue current medications, follow up in 3 months
  `,
  legal: `
    PURCHASE AGREEMENT
    
    This Agreement is entered into on December 1, 2024, between:
    SELLER: ABC Corporation, a Delaware corporation
    BUYER: XYZ Holdings LLC, a California limited liability company
    
    PURCHASE PRICE: $2,500,000
    PROPERTY: 123 Main Street, Los Angeles, CA 90210
    CLOSING DATE: January 15, 2025
    
    The Seller agrees to transfer all rights, title, and interest in the Property
    to the Buyer upon payment of the Purchase Price and satisfaction of all conditions.
  `,
  logistics: `
    BILL OF LADING
    
    SHIPPER: Global Trade Inc.
    CONSIGNEE: Pacific Imports Ltd.
    TRACKING: GL123456789
    
    ORIGIN: Shanghai, China
    DESTINATION: Los Angeles, CA, USA
    
    CARGO: 500 units Electronic Components
    WEIGHT: 2,500 kg
    CONTAINER: TCLU1234567
    
    CUSTOMS DECLARATION: HS Code 8517.12.00
    VALUE: $125,000 USD
  `,
  finance: `
    LOAN AGREEMENT
    
    BORROWER: Tech Startup Inc.
    LENDER: Capital Bank
    LOAN AMOUNT: $1,000,000
    INTEREST RATE: 5.75% per annum
    TERM: 5 years
    
    ACCOUNT NUMBER: 4567890123456789
    ROUTING NUMBER: 021000021
    
    Monthly payment of $19,251.75 due on the 1st of each month
    beginning February 1, 2025.
  `
};

interface TestResult {
  service: string;
  industry: string;
  status: 'PASSED' | 'FAILED';
  processingTime: number;
  error?: string;
  confidence?: number;
  summary?: string;
  details?: any;
}

// Test OpenAI integration
router.post('/test/openai', async (req, res) => {
  const results: TestResult[] = [];
  const openaiService = new OpenAIService();
  
  console.log('🧠 Testing OpenAI Integration...');
  
  for (const [industry, document] of Object.entries(testDocuments)) {
    const startTime = Date.now();
    try {
      console.log(`  📄 Testing ${industry} document analysis...`);
      
      const result = await openaiService.analyzeDocument(document, industry);
      const processingTime = Date.now() - startTime;
      
      if (result && result.summary && result.keyEntities.length >= 0) {
        console.log(`  ✅ OpenAI ${industry} - PASSED (${processingTime}ms)`);
        results.push({
          service: 'OpenAI',
          industry,
          status: 'PASSED',
          processingTime,
          confidence: result.confidence,
          summary: result.summary.substring(0, 200),
          details: {
            entitiesFound: result.keyEntities.length,
            insights: result.insights.length,
            complianceStatus: result.compliance.status
          }
        });
      } else {
        throw new Error('Invalid result structure');
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ OpenAI ${industry} - FAILED: ${errorMessage}`);
      results.push({
        service: 'OpenAI',
        industry,
        status: 'FAILED',
        processingTime,
        error: errorMessage
      });
    }
  }
  
  res.json({
    service: 'OpenAI',
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    }
  });
});

// Test Anthropic integration
router.post('/test/anthropic', async (req, res) => {
  const results: TestResult[] = [];
  const multiAIService = new MultiAIService();
  
  console.log('🤖 Testing Anthropic Integration...');
  
  // Check if Anthropic is initialized
  if (!(multiAIService as any).anthropic) {
    console.log('  ⚠️  Anthropic client not initialized');
    return res.json({
      service: 'Anthropic',
      error: 'Anthropic client not initialized - check API key configuration',
      results: [],
      summary: { total: 0, passed: 0, failed: 0 }
    });
  }
  
  for (const [industry, document] of Object.entries(testDocuments)) {
    const startTime = Date.now();
    try {
      console.log(`  📄 Testing ${industry} document analysis...`);
      
      // Use the private method through reflection for testing
      const result = await (multiAIService as any).analyzeWithAnthropic(document, industry);
      const processingTime = Date.now() - startTime;
      
      if (result && result.summary && result.confidence > 0) {
        console.log(`  ✅ Anthropic ${industry} - PASSED (${processingTime}ms)`);
        results.push({
          service: 'Anthropic',
          industry,
          status: 'PASSED',
          processingTime,
          confidence: result.confidence,
          summary: result.summary.substring(0, 200),
          details: {
            analysis: result.analysis?.substring(0, 200),
            complianceStatus: result.complianceStatus
          }
        });
      } else {
        throw new Error('No result returned or invalid structure');
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Anthropic ${industry} - FAILED: ${errorMessage}`);
      results.push({
        service: 'Anthropic',
        industry,
        status: 'FAILED',
        processingTime,
        error: errorMessage
      });
    }
  }
  
  res.json({
    service: 'Anthropic',
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    }
  });
});

// Test Gemini integration
router.post('/test/gemini', async (req, res) => {
  const results: TestResult[] = [];
  
  console.log('💎 Testing Gemini Integration...');
  
  // Test basic Gemini functions first
  try {
    const testText = "This is a sample document for testing Gemini's analysis capabilities.";
    const startTime = Date.now();
    
    const [summary, sentiment] = await Promise.all([
      summarizeArticle(testText),
      analyzeSentiment(testText)
    ]);
    
    const processingTime = Date.now() - startTime;
    
    if (summary && sentiment && sentiment.rating && sentiment.confidence) {
      console.log('  ✅ Gemini basic functions - PASSED');
      results.push({
        service: 'Gemini',
        industry: 'basic_test',
        status: 'PASSED',
        processingTime,
        summary: summary.substring(0, 200),
        details: {
          sentiment: {
            rating: sentiment.rating,
            confidence: sentiment.confidence
          }
        }
      });
    } else {
      throw new Error('Invalid basic function results');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Gemini basic functions - FAILED: ${errorMessage}`);
    results.push({
      service: 'Gemini',
      industry: 'basic_test',
      status: 'FAILED',
      processingTime: 0,
      error: errorMessage
    });
  }

  // Test with industry documents
  for (const [industry, document] of Object.entries(testDocuments)) {
    const startTime = Date.now();
    try {
      console.log(`  📄 Testing ${industry} document analysis...`);
      
      const [summary, sentiment] = await Promise.all([
        summarizeArticle(document),
        analyzeSentiment(document)
      ]);
      
      const processingTime = Date.now() - startTime;
      
      if (summary && sentiment) {
        console.log(`  ✅ Gemini ${industry} - PASSED (${processingTime}ms)`);
        results.push({
          service: 'Gemini',
          industry,
          status: 'PASSED',
          processingTime,
          summary: summary.substring(0, 200),
          details: {
            sentiment: {
              rating: sentiment.rating,
              confidence: sentiment.confidence
            }
          }
        });
      } else {
        throw new Error('Missing results from Gemini');
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Gemini ${industry} - FAILED: ${errorMessage}`);
      results.push({
        service: 'Gemini',
        industry,
        status: 'FAILED',
        processingTime,
        error: errorMessage
      });
    }
  }
  
  res.json({
    service: 'Gemini',
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    }
  });
});

// Test Multi-AI consensus system
router.post('/test/multi-ai', async (req, res) => {
  const results: TestResult[] = [];
  const multiAIService = new MultiAIService();
  
  console.log('🤝 Testing Multi-AI Consensus System...');
  
  for (const [industry, document] of Object.entries(testDocuments)) {
    const startTime = Date.now();
    try {
      console.log(`  🔄 Testing ${industry} multi-AI analysis...`);
      
      const result = await multiAIService.analyzeDocument(document, industry);
      const processingTime = Date.now() - startTime;
      
      if (result && result.consensus && result.ocrResults) {
        console.log(`  ✅ Multi-AI ${industry} - PASSED (${processingTime}ms)`);
        console.log(`     Recommended Model: ${result.consensus.recommendedModel}`);
        
        results.push({
          service: 'Multi-AI',
          industry,
          status: 'PASSED',
          processingTime,
          confidence: result.consensus.confidence,
          summary: result.consensus.summary.substring(0, 200),
          details: {
            recommendedModel: result.consensus.recommendedModel,
            modelsUsed: {
              openai: !!result.openai,
              gemini: !!result.gemini,
              anthropic: !!result.anthropic
            },
            keyFindings: result.consensus.keyFindings.length,
            ocrConfidence: result.ocrResults.confidence
          }
        });
      } else {
        throw new Error('Invalid multi-AI result structure');
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Multi-AI ${industry} - FAILED: ${errorMessage}`);
      results.push({
        service: 'Multi-AI',
        industry,
        status: 'FAILED',
        processingTime,
        error: errorMessage
      });
    }
  }
  
  res.json({
    service: 'Multi-AI',
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      averageTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
    }
  });
});

// Run comprehensive test suite
router.post('/test/comprehensive', async (req, res) => {
  console.log('🚀 Starting Comprehensive AI Integration Testing...\n');
  const startTime = Date.now();
  
  try {
    // Test all services sequentially to avoid rate limiting
    const [openaiTest, anthropicTest, geminiTest, multiAITest] = await Promise.allSettled([
      fetch('http://localhost:5000/api/test/openai', { method: 'POST' }).then(r => r.json()),
      fetch('http://localhost:5000/api/test/anthropic', { method: 'POST' }).then(r => r.json()),
      fetch('http://localhost:5000/api/test/gemini', { method: 'POST' }).then(r => r.json()),
      fetch('http://localhost:5000/api/test/multi-ai', { method: 'POST' }).then(r => r.json())
    ]);
    
    const totalTime = Date.now() - startTime;
    
    // Compile comprehensive results
    const comprehensiveResults = {
      totalTestTime: totalTime,
      services: {
        openai: openaiTest.status === 'fulfilled' ? openaiTest.value : { error: openaiTest.reason },
        anthropic: anthropicTest.status === 'fulfilled' ? anthropicTest.value : { error: anthropicTest.reason },
        gemini: geminiTest.status === 'fulfilled' ? geminiTest.value : { error: geminiTest.reason },
        multiAI: multiAITest.status === 'fulfilled' ? multiAITest.value : { error: multiAITest.reason }
      }
    };
    
    // Calculate overall statistics
    const allResults = Object.values(comprehensiveResults.services)
      .filter(service => service.results)
      .flatMap(service => service.results);
    
    const overallStats = {
      totalTests: allResults.length,
      passed: allResults.filter(r => r.status === 'PASSED').length,
      failed: allResults.filter(r => r.status === 'FAILED').length,
      successRate: allResults.length > 0 ? ((allResults.filter(r => r.status === 'PASSED').length / allResults.length) * 100).toFixed(1) + '%' : '0%',
      averageProcessingTime: allResults.length > 0 ? (allResults.reduce((sum, r) => sum + r.processingTime, 0) / allResults.length).toFixed(0) + 'ms' : '0ms'
    };
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log(`   Success Rate: ${overallStats.successRate}`);
    console.log(`   Total Tests: ${overallStats.totalTests}`);
    console.log(`   Passed: ${overallStats.passed}`);
    console.log(`   Failed: ${overallStats.failed}`);
    console.log(`   Average Time: ${overallStats.averageProcessingTime}`);
    
    res.json({
      ...comprehensiveResults,
      overallStats,
      recommendations: generateRecommendations(comprehensiveResults.services),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: 'Comprehensive test failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

interface ServiceSummary {
  total?: number;
  passed?: number;
  failed?: number;
}

interface ServiceData {
  summary?: ServiceSummary;
  error?: string;
}

function generateRecommendations(services: Record<string, ServiceData>): string[] {
  const recommendations: string[] = [];
  
  if (services.openai?.summary?.failed && services.openai.summary.failed > 0) {
    recommendations.push('OpenAI: Check API key and rate limits');
  }
  
  if (services.anthropic?.error || (services.anthropic?.summary?.failed && services.anthropic.summary.failed > 0)) {
    recommendations.push('Anthropic: Verify API key configuration and model access');
  }
  
  if (services.gemini?.summary?.failed && services.gemini.summary.failed > 0) {
    recommendations.push('Gemini: Check API key and quota limits');
  }
  
  if (services.multiAI?.summary?.failed && services.multiAI.summary.failed > 0) {
    recommendations.push('Multi-AI: Review consensus algorithm and error handling');
  }
  
  // Calculate overall success rate
  const allServices = Object.values(services).filter((s): s is ServiceData & { summary: ServiceSummary } => !!s.summary);
  const totalTests = allServices.reduce((sum, s) => sum + (s.summary.total || 0), 0);
  const totalPassed = allServices.reduce((sum, s) => sum + (s.summary.passed || 0), 0);
  const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
  
  if (successRate < 80) {
    recommendations.push('CRITICAL: Success rate below 80% - immediate attention required');
  } else if (successRate < 95) {
    recommendations.push('WARNING: Success rate below 95% - optimization recommended');
  } else {
    recommendations.push('EXCELLENT: All systems performing well');
  }
  
  return recommendations;
}

export default router;