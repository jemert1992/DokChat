import { MultiAIService } from './services/multiAIService.js';
import { OpenAIService } from './services/openaiService.js';
import { summarizeArticle, analyzeSentiment } from '../gemini.js';

class AIIntegrationTester {
  constructor() {
    this.multiAIService = new MultiAIService();
    this.openaiService = new OpenAIService();
    this.testResults = {
      openai: { passed: 0, failed: 0, tests: [] },
      anthropic: { passed: 0, failed: 0, tests: [] },
      gemini: { passed: 0, failed: 0, tests: [] },
      multiAI: { passed: 0, failed: 0, tests: [] },
      overall: { passed: 0, failed: 0 }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive AI Integration Testing...\n');
    
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

    try {
      // Test each AI service individually
      await this.testOpenAIIntegration(testDocuments);
      await this.testAnthropicIntegration(testDocuments);
      await this.testGeminiIntegration(testDocuments);
      
      // Test multi-AI consensus system
      await this.testMultiAIConsensus(testDocuments);
      
      // Test error handling and edge cases
      await this.testErrorHandling();
      
      // Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Critical error during testing:', error);
      this.testResults.overall.failed++;
    }
  }

  async testOpenAIIntegration(testDocuments) {
    console.log('🧠 Testing OpenAI Integration...');
    
    for (const [industry, document] of Object.entries(testDocuments)) {
      const testName = `OpenAI ${industry} analysis`;
      try {
        console.log(`  📄 Testing ${industry} document analysis...`);
        
        const startTime = Date.now();
        const result = await this.openaiService.analyzeDocument(document, industry);
        const processingTime = Date.now() - startTime;
        
        // Validate result structure
        const isValid = this.validateOpenAIResult(result);
        
        if (isValid && result.summary && result.keyEntities.length > 0) {
          console.log(`  ✅ ${testName} - PASSED (${processingTime}ms)`);
          console.log(`     Summary: ${result.summary.substring(0, 100)}...`);
          console.log(`     Entities: ${result.keyEntities.length}`);
          console.log(`     Confidence: ${result.confidence}`);
          
          this.testResults.openai.passed++;
          this.testResults.openai.tests.push({
            name: testName,
            status: 'PASSED',
            processingTime,
            confidence: result.confidence,
            entitiesFound: result.keyEntities.length
          });
        } else {
          throw new Error('Invalid result structure or insufficient data');
        }
        
      } catch (error) {
        console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
        this.testResults.openai.failed++;
        this.testResults.openai.tests.push({
          name: testName,
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  async testAnthropicIntegration(testDocuments) {
    console.log('\n🤖 Testing Anthropic Integration...');
    
    // Test if Anthropic is properly initialized
    if (!this.multiAIService.anthropic) {
      console.log('  ⚠️  Anthropic client not initialized - checking API key...');
      const hasKey = process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO';
      console.log(`  🔑 ANTHROPIC_API_KEY present: ${hasKey}`);
      
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('  ❌ Anthropic tests skipped - API key not configured');
        this.testResults.anthropic.failed += Object.keys(testDocuments).length;
        return;
      }
    }

    for (const [industry, document] of Object.entries(testDocuments)) {
      const testName = `Anthropic ${industry} analysis`;
      try {
        console.log(`  📄 Testing ${industry} document analysis...`);
        
        const startTime = Date.now();
        // Use the private method through multiAIService
        const result = await this.multiAIService.analyzeWithAnthropic(document, industry);
        const processingTime = Date.now() - startTime;
        
        if (result && result.summary && result.confidence > 0) {
          console.log(`  ✅ ${testName} - PASSED (${processingTime}ms)`);
          console.log(`     Summary: ${result.summary.substring(0, 100)}...`);
          console.log(`     Confidence: ${result.confidence}`);
          
          this.testResults.anthropic.passed++;
          this.testResults.anthropic.tests.push({
            name: testName,
            status: 'PASSED',
            processingTime,
            confidence: result.confidence
          });
        } else {
          throw new Error('No result returned or invalid result structure');
        }
        
      } catch (error) {
        console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
        this.testResults.anthropic.failed++;
        this.testResults.anthropic.tests.push({
          name: testName,
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  async testGeminiIntegration(testDocuments) {
    console.log('\n💎 Testing Gemini Integration...');
    
    // Test basic Gemini functions
    const testText = "This is a sample document for testing Gemini's analysis capabilities.";
    
    try {
      console.log('  📝 Testing Gemini summarization...');
      const summary = await summarizeArticle(testText);
      
      console.log('  📊 Testing Gemini sentiment analysis...');
      const sentiment = await analyzeSentiment(testText);
      
      if (summary && sentiment && sentiment.rating && sentiment.confidence) {
        console.log('  ✅ Gemini basic functions - PASSED');
        console.log(`     Summary: ${summary.substring(0, 80)}...`);
        console.log(`     Sentiment: ${sentiment.rating}/5 (confidence: ${sentiment.confidence})`);
        
        this.testResults.gemini.passed++;
        this.testResults.gemini.tests.push({
          name: 'Gemini basic functions',
          status: 'PASSED',
          summary: summary.length,
          sentiment: sentiment.rating
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Gemini basic functions - FAILED: ${error.message}`);
      this.testResults.gemini.failed++;
      this.testResults.gemini.tests.push({
        name: 'Gemini basic functions',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test Gemini with document analysis
    for (const [industry, document] of Object.entries(testDocuments)) {
      const testName = `Gemini ${industry} document`;
      try {
        const startTime = Date.now();
        const summary = await summarizeArticle(document);
        const sentiment = await analyzeSentiment(document);
        const processingTime = Date.now() - startTime;
        
        if (summary && sentiment) {
          console.log(`  ✅ ${testName} - PASSED (${processingTime}ms)`);
          this.testResults.gemini.passed++;
          this.testResults.gemini.tests.push({
            name: testName,
            status: 'PASSED',
            processingTime
          });
        }
      } catch (error) {
        console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
        this.testResults.gemini.failed++;
        this.testResults.gemini.tests.push({
          name: testName,
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  async testMultiAIConsensus(testDocuments) {
    console.log('\n🤝 Testing Multi-AI Consensus System...');
    
    for (const [industry, document] of Object.entries(testDocuments)) {
      const testName = `Multi-AI ${industry} consensus`;
      try {
        console.log(`  🔄 Testing ${industry} multi-AI analysis...`);
        
        const startTime = Date.now();
        const result = await this.multiAIService.analyzeDocument(document, industry);
        const processingTime = Date.now() - startTime;
        
        // Validate multi-AI result structure
        const isValid = this.validateMultiAIResult(result);
        
        if (isValid) {
          console.log(`  ✅ ${testName} - PASSED (${processingTime}ms)`);
          console.log(`     Recommended Model: ${result.consensus.recommendedModel}`);
          console.log(`     Consensus Confidence: ${result.consensus.confidence}`);
          console.log(`     OpenAI: ${result.openai ? '✓' : '✗'}`);
          console.log(`     Gemini: ${result.gemini ? '✓' : '✗'}`);
          console.log(`     Anthropic: ${result.anthropic ? '✓' : '✗'}`);
          
          this.testResults.multiAI.passed++;
          this.testResults.multiAI.tests.push({
            name: testName,
            status: 'PASSED',
            processingTime,
            recommendedModel: result.consensus.recommendedModel,
            confidence: result.consensus.confidence,
            modelsUsed: {
              openai: !!result.openai,
              gemini: !!result.gemini,
              anthropic: !!result.anthropic
            }
          });
        } else {
          throw new Error('Invalid multi-AI result structure');
        }
        
      } catch (error) {
        console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
        this.testResults.multiAI.failed++;
        this.testResults.multiAI.tests.push({
          name: testName,
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  async testErrorHandling() {
    console.log('\n🛡️  Testing Error Handling and Edge Cases...');
    
    const edgeCases = [
      { name: 'Empty document', document: '', industry: 'general' },
      { name: 'Very long document', document: 'A'.repeat(10000), industry: 'general' },
      { name: 'Special characters', document: '!@#$%^&*()_+{}|:<>?', industry: 'general' },
      { name: 'Non-English text', document: 'こんにちは世界', industry: 'general' },
      { name: 'Invalid industry', document: 'Test document', industry: 'invalid_industry' }
    ];

    for (const testCase of edgeCases) {
      try {
        const result = await this.multiAIService.analyzeDocument(testCase.document, testCase.industry);
        
        if (result && result.consensus) {
          console.log(`  ✅ ${testCase.name} - Handled gracefully`);
          this.testResults.multiAI.passed++;
        } else {
          throw new Error('Unexpected result structure');
        }
        
      } catch (error) {
        console.log(`  ⚠️  ${testCase.name} - Error: ${error.message}`);
        this.testResults.multiAI.failed++;
      }
    }
  }

  validateOpenAIResult(result) {
    return result && 
           typeof result.summary === 'string' &&
           Array.isArray(result.keyEntities) &&
           typeof result.confidence === 'number' &&
           result.compliance &&
           Array.isArray(result.insights);
  }

  validateMultiAIResult(result) {
    return result &&
           result.consensus &&
           result.consensus.recommendedModel &&
           typeof result.consensus.confidence === 'number' &&
           result.ocrResults &&
           typeof result.ocrResults.text === 'string';
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE AI INTEGRATION TEST REPORT');
    console.log('=' .repeat(60));
    
    // Calculate overall stats
    const totalPassed = Object.values(this.testResults).reduce((sum, service) => sum + (service.passed || 0), 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, service) => sum + (service.failed || 0), 0);
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${successRate}%`);
    
    // Service-specific results
    console.log(`\n📋 SERVICE BREAKDOWN:`);
    
    for (const [service, results] of Object.entries(this.testResults)) {
      if (service === 'overall') continue;
      
      const serviceTotal = results.passed + results.failed;
      const serviceRate = serviceTotal > 0 ? ((results.passed / serviceTotal) * 100).toFixed(1) : 0;
      
      console.log(`\n${this.getServiceIcon(service)} ${service.toUpperCase()}:`);
      console.log(`   Tests: ${serviceTotal} | Passed: ${results.passed} | Failed: ${results.failed} | Rate: ${serviceRate}%`);
      
      // Show detailed results for failed tests
      const failedTests = results.tests.filter(t => t.status === 'FAILED');
      if (failedTests.length > 0) {
        console.log(`   ❌ Failed Tests:`);
        failedTests.forEach(test => {
          console.log(`     - ${test.name}: ${test.error}`);
        });
      }
      
      // Show performance metrics for passed tests
      const passedTests = results.tests.filter(t => t.status === 'PASSED');
      if (passedTests.length > 0 && passedTests.some(t => t.processingTime)) {
        const avgTime = passedTests
          .filter(t => t.processingTime)
          .reduce((sum, t) => sum + t.processingTime, 0) / passedTests.filter(t => t.processingTime).length;
        console.log(`   ⚡ Average Processing Time: ${avgTime.toFixed(0)}ms`);
      }
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (this.testResults.openai.failed > 0) {
      console.log(`   - OpenAI: Check API key and rate limits`);
    }
    
    if (this.testResults.anthropic.failed > 0) {
      console.log(`   - Anthropic: Verify API key configuration and model access`);
    }
    
    if (this.testResults.gemini.failed > 0) {
      console.log(`   - Gemini: Check API key and quota limits`);
    }
    
    if (this.testResults.multiAI.failed > 0) {
      console.log(`   - Multi-AI: Review consensus algorithm and error handling`);
    }
    
    if (successRate < 80) {
      console.log(`   - CRITICAL: Success rate below 80% - immediate attention required`);
    } else if (successRate < 95) {
      console.log(`   - WARNING: Success rate below 95% - optimization recommended`);
    } else {
      console.log(`   - EXCELLENT: All systems performing well`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 AI Integration Testing Complete\n');
  }

  getServiceIcon(service) {
    const icons = {
      openai: '🧠',
      anthropic: '🤖',
      gemini: '💎',
      multiAI: '🤝'
    };
    return icons[service] || '🔧';
  }
}

// Main execution
async function main() {
  const tester = new AIIntegrationTester();
  await tester.runAllTests();
}

// Run tests if called directly
main().catch(console.error);

export { AIIntegrationTester };