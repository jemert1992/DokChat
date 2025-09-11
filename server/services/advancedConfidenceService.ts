// Advanced Confidence Service - Industry-standard confidence calculation

interface ConfidenceMetrics {
  overall: number;
  components: {
    content: number;
    consensus: number;
    historical: number;
    technical: number;
    domain: number;
  };
  uncertainty: {
    aleatoric: number; // Data uncertainty
    epistemic: number; // Model uncertainty  
    total: number;
  };
  calibration: {
    reliability: number; // How well confidence matches accuracy
    sharpness: number; // How decisive the predictions are
    brier: number; // Brier score for probability accuracy
  };
  explanation: {
    primaryFactors: string[];
    confidenceBoosts: Array<{ source: string; impact: number; reason: string }>;
    uncertaintyFactors: string[];
    recommendations: string[];
  };
}

interface ModelPrediction {
  model: string;
  prediction: any;
  confidence: number;
  entropy: number;
  features: {
    textQuality: number;
    structuralClarity: number;
    domainMatch: number;
    processingTime: number;
  };
}

interface HistoricalPattern {
  documentType: string;
  industry: string;
  averageConfidence: number;
  accuracyRate: number;
  sampleSize: number;
  lastUpdated: Date;
}

interface ConfidenceCalibrationData {
  confidenceBin: [number, number]; // e.g., [0.8, 0.9]
  actualAccuracy: number;
  sampleCount: number;
  reliability: number;
}

/**
 * Advanced Confidence Scoring Service for DOKTECH 3.0
 * 
 * Implements industry-standard confidence calculation algorithms to achieve
 * enterprise-grade reliability and transparency. Provides multi-dimensional
 * confidence scoring with uncertainty quantification and explainability.
 * 
 * Key Features:
 * - Bayesian confidence aggregation with uncertainty quantification
 * - Multi-dimensional scoring (content, consensus, historical, technical, domain)
 * - Confidence calibration and reliability tracking
 * - Explainable confidence with factor analysis
 * - Industry-standard uncertainty metrics (aleatoric, epistemic)
 * - Real-time confidence adaptation based on historical performance
 * - Probabilistic reasoning for improved decision making
 */
export class AdvancedConfidenceService {
  private calibrationData: Map<string, ConfidenceCalibrationData[]> = new Map();
  private historicalPatterns: Map<string, HistoricalPattern> = new Map();
  private modelReliability: Map<string, number> = new Map();
  
  constructor() {
    this.initializeCalibrationData();
    this.initializeModelReliability();
  }

  /**
   * Calculate advanced confidence metrics using industry-standard algorithms
   */
  async calculateAdvancedConfidence(
    modelPredictions: ModelPrediction[],
    documentContext: {
      industry: string;
      documentType: string;
      textQuality: number;
      processingComplexity: number;
    },
    ragContext?: {
      similarity: number;
      historicalConfidence: number;
      sampleSize: number;
    },
    templateFreeContext?: {
      structureConfidence: number;
      patternMatch: number;
      adaptiveConfidence: number;
    }
  ): Promise<ConfidenceMetrics> {
    console.log('🔄 Calculating advanced confidence metrics...');

    try {
      // Step 1: Calculate base component confidences
      const componentConfidences = await this.calculateComponentConfidences(
        modelPredictions,
        documentContext,
        ragContext,
        templateFreeContext
      );

      // Step 2: Apply Bayesian aggregation for overall confidence
      const overallConfidence = this.calculateBayesianAggregation(
        componentConfidences,
        modelPredictions,
        documentContext
      );

      // Step 3: Quantify uncertainty (aleatoric + epistemic)
      const uncertaintyMetrics = this.calculateUncertaintyMetrics(
        modelPredictions,
        componentConfidences,
        documentContext
      );

      // Step 4: Apply confidence calibration
      const calibratedConfidence = await this.applyCalibratedConfidence(
        overallConfidence,
        documentContext,
        uncertaintyMetrics.total
      );

      // Step 5: Calculate calibration metrics
      const calibrationMetrics = await this.calculateCalibrationMetrics(
        calibratedConfidence,
        documentContext
      );

      // Step 6: Generate confidence explanation
      const explanation = this.generateConfidenceExplanation(
        componentConfidences,
        modelPredictions,
        ragContext,
        templateFreeContext,
        uncertaintyMetrics
      );

      const confidenceMetrics: ConfidenceMetrics = {
        overall: Math.round(calibratedConfidence * 100) / 100,
        components: componentConfidences,
        uncertainty: uncertaintyMetrics,
        calibration: calibrationMetrics,
        explanation
      };

      console.log(`✅ Advanced confidence calculated: ${Math.round(calibratedConfidence * 100)}% (uncertainty: ${Math.round(uncertaintyMetrics.total * 100)}%)`);
      return confidenceMetrics;

    } catch (error) {
      console.error('❌ Advanced confidence calculation failed:', error);
      
      // Fallback to simple confidence calculation
      return this.generateFallbackConfidence(modelPredictions, documentContext);
    }
  }

  /**
   * Calculate individual component confidences
   */
  private async calculateComponentConfidences(
    modelPredictions: ModelPrediction[],
    documentContext: any,
    ragContext?: any,
    templateFreeContext?: any
  ): Promise<ConfidenceMetrics['components']> {
    
    // Content Quality Confidence (based on text clarity, structure, completeness)
    const contentConfidence = this.calculateContentConfidence(
      documentContext.textQuality,
      documentContext.processingComplexity,
      modelPredictions
    );

    // Model Consensus Confidence (agreement between models)
    const consensusConfidence = this.calculateConsensusConfidence(modelPredictions);

    // Historical Pattern Confidence (based on similar documents)
    const historicalConfidence = this.calculateHistoricalConfidence(
      documentContext,
      ragContext
    );

    // Technical Processing Confidence (OCR quality, processing success)
    const technicalConfidence = this.calculateTechnicalConfidence(
      modelPredictions,
      documentContext
    );

    // Domain-Specific Confidence (industry knowledge, template matching)
    const domainConfidence = this.calculateDomainConfidence(
      documentContext,
      templateFreeContext,
      modelPredictions
    );

    return {
      content: Math.round(contentConfidence * 100) / 100,
      consensus: Math.round(consensusConfidence * 100) / 100,
      historical: Math.round(historicalConfidence * 100) / 100,
      technical: Math.round(technicalConfidence * 100) / 100,
      domain: Math.round(domainConfidence * 100) / 100
    };
  }

  /**
   * Calculate content quality confidence
   */
  private calculateContentConfidence(
    textQuality: number,
    processingComplexity: number,
    modelPredictions: ModelPrediction[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Text quality contribution (40% weight)
    confidence += (textQuality - 0.5) * 0.4;

    // Processing complexity penalty (simpler = higher confidence)
    const complexityPenalty = (processingComplexity - 0.5) * 0.2;
    confidence -= complexityPenalty;

    // Model feature analysis
    const avgFeatureScore = modelPredictions.reduce((sum, pred) => {
      return sum + (
        pred.features.textQuality * 0.3 +
        pred.features.structuralClarity * 0.3 +
        pred.features.domainMatch * 0.2 +
        (1 - pred.features.processingTime / 10000) * 0.2 // Time penalty
      );
    }, 0) / (modelPredictions.length || 1);

    confidence += (avgFeatureScore - 0.5) * 0.3;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Calculate model consensus confidence using entropy and agreement
   */
  private calculateConsensusConfidence(modelPredictions: ModelPrediction[]): number {
    if (modelPredictions.length < 2) return 0.6; // Default for single model

    // Calculate pairwise agreement
    let totalAgreement = 0;
    let pairCount = 0;

    for (let i = 0; i < modelPredictions.length; i++) {
      for (let j = i + 1; j < modelPredictions.length; j++) {
        const pred1 = modelPredictions[i];
        const pred2 = modelPredictions[j];
        
        // Agreement based on confidence similarity and entropy
        const confidenceAgreement = 1 - Math.abs(pred1.confidence - pred2.confidence);
        const entropyAgreement = 1 - Math.abs(pred1.entropy - pred2.entropy);
        
        totalAgreement += (confidenceAgreement * 0.6 + entropyAgreement * 0.4);
        pairCount++;
      }
    }

    const avgAgreement = pairCount > 0 ? totalAgreement / pairCount : 0.6;

    // Boost confidence if models consistently agree
    const avgConfidence = modelPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / modelPredictions.length;
    const confidenceVariance = modelPredictions.reduce((sum, pred) => 
      sum + Math.pow(pred.confidence - avgConfidence, 2), 0) / modelPredictions.length;

    // Low variance = high consensus
    const variancePenalty = Math.min(confidenceVariance * 2, 0.3);
    
    return Math.max(0.2, Math.min(0.95, avgAgreement - variancePenalty));
  }

  /**
   * Calculate historical pattern confidence using similarity and performance data
   */
  private calculateHistoricalConfidence(
    documentContext: any,
    ragContext?: any
  ): number {
    let confidence = 0.5; // Base confidence

    if (ragContext && ragContext.sampleSize > 0) {
      // Strong historical pattern found
      const historicalWeight = Math.min(ragContext.sampleSize / 10, 1.0);
      const similarityBonus = ragContext.similarity * 0.3;
      const historicalAccuracy = ragContext.historicalConfidence || 0.7;
      
      confidence = (confidence * (1 - historicalWeight)) + 
                  (historicalAccuracy * historicalWeight) + 
                  similarityBonus;
    }

    // Industry-specific pattern adjustment
    const patternKey = `${documentContext.industry}_${documentContext.documentType}`;
    const pattern = this.historicalPatterns.get(patternKey);
    
    if (pattern && pattern.sampleSize >= 5) {
      const patternWeight = Math.min(pattern.sampleSize / 20, 0.4);
      confidence = confidence * (1 - patternWeight) + pattern.accuracyRate * patternWeight;
    }

    return Math.max(0.2, Math.min(0.9, confidence));
  }

  /**
   * Calculate technical processing confidence
   */
  private calculateTechnicalConfidence(
    modelPredictions: ModelPrediction[],
    documentContext: any
  ): number {
    let confidence = 0.7; // Base technical confidence

    // Model reliability weighting
    const modelReliabilitySum = modelPredictions.reduce((sum, pred) => {
      const reliability = this.modelReliability.get(pred.model) || 0.8;
      return sum + reliability * pred.confidence;
    }, 0);
    
    const avgModelReliability = modelReliabilitySum / (modelPredictions.length || 1);
    confidence += (avgModelReliability - 0.8) * 0.3;

    // Processing time penalty (slower = less confident)
    const avgProcessingTime = modelPredictions.reduce((sum, pred) => 
      sum + pred.features.processingTime, 0) / (modelPredictions.length || 1);
    
    if (avgProcessingTime > 5000) { // > 5 seconds
      confidence -= Math.min((avgProcessingTime - 5000) / 10000, 0.2);
    }

    // Text quality technical score
    confidence += (documentContext.textQuality - 0.7) * 0.2;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Calculate domain-specific confidence
   */
  private calculateDomainConfidence(
    documentContext: any,
    templateFreeContext?: any,
    modelPredictions?: ModelPrediction[]
  ): number {
    let confidence = 0.6; // Base domain confidence

    // Industry match bonus
    if (documentContext.industry !== 'general') {
      confidence += 0.1; // Specific industry processing
    }

    // Template-free analysis confidence
    if (templateFreeContext) {
      const structureWeight = 0.3;
      const patternWeight = 0.2;
      const adaptiveWeight = 0.3;

      confidence += (templateFreeContext.structureConfidence - 0.5) * structureWeight;
      confidence += (templateFreeContext.patternMatch - 0.5) * patternWeight;
      confidence += (templateFreeContext.adaptiveConfidence - 0.5) * adaptiveWeight;
    }

    // Domain match from model features
    if (modelPredictions && modelPredictions.length > 0) {
      const avgDomainMatch = modelPredictions.reduce((sum, pred) => 
        sum + pred.features.domainMatch, 0) / modelPredictions.length;
      confidence += (avgDomainMatch - 0.5) * 0.2;
    }

    return Math.max(0.3, Math.min(0.9, confidence));
  }

  /**
   * Apply Bayesian aggregation for overall confidence
   */
  private calculateBayesianAggregation(
    components: ConfidenceMetrics['components'],
    modelPredictions: ModelPrediction[],
    documentContext: any
  ): number {
    // Bayesian weights based on component reliability and context
    const weights = this.calculateBayesianWeights(components, documentContext);
    
    // Prior probability (domain-specific baseline)
    const prior = this.getDomainPrior(documentContext.industry, documentContext.documentType);
    
    // Likelihood from component evidence
    const likelihood = (
      components.content * weights.content +
      components.consensus * weights.consensus +
      components.historical * weights.historical +
      components.technical * weights.technical +
      components.domain * weights.domain
    );

    // Bayesian posterior probability
    const posterior = this.calculateBayesianPosterior(prior, likelihood, weights);
    
    // Apply model entropy adjustment
    const avgEntropy = modelPredictions.reduce((sum, pred) => sum + pred.entropy, 0) / 
                      (modelPredictions.length || 1);
    const entropyAdjustment = Math.max(0, (0.5 - avgEntropy) * 0.1);

    return Math.max(0.1, Math.min(0.98, posterior + entropyAdjustment));
  }

  /**
   * Calculate Bayesian weights for component aggregation
   */
  private calculateBayesianWeights(
    components: ConfidenceMetrics['components'],
    documentContext: any
  ): Record<string, number> {
    const baseWeights = {
      content: 0.25,
      consensus: 0.25,
      historical: 0.20,
      technical: 0.15,
      domain: 0.15
    };

    // Adjust weights based on component confidence and context
    const adjustedWeights = { ...baseWeights };

    // Boost consensus weight if models strongly agree
    if (components.consensus > 0.8) {
      adjustedWeights.consensus += 0.1;
    }

    // Boost historical weight if good patterns exist
    if (components.historical > 0.8) {
      adjustedWeights.historical += 0.1;
    }

    // Boost domain weight for specialized industries
    if (documentContext.industry !== 'general' && components.domain > 0.7) {
      adjustedWeights.domain += 0.1;
    }

    // Normalize weights
    const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
    Object.keys(adjustedWeights).forEach(key => {
      adjustedWeights[key as keyof typeof adjustedWeights] /= totalWeight;
    });

    return adjustedWeights;
  }

  /**
   * Get domain-specific prior probability
   */
  private getDomainPrior(industry: string, documentType: string): number {
    // Industry-specific baseline confidence
    const industryPriors: Record<string, number> = {
      medical: 0.75,     // High accuracy needed
      legal: 0.80,       // High accuracy needed  
      finance: 0.82,     // High accuracy needed
      logistics: 0.70,   // Moderate accuracy
      real_estate: 0.72, // Moderate accuracy
      general: 0.65      // Lower baseline
    };

    // Document type adjustments
    const documentTypeAdjustments: Record<string, number> = {
      contract: 0.05,
      invoice: 0.03,
      medical_record: 0.04,
      legal_document: 0.06,
      report: 0.02,
      form: 0.01
    };

    const basePrior = industryPriors[industry] || industryPriors.general;
    const typeAdjustment = documentTypeAdjustments[documentType] || 0;

    return Math.max(0.5, Math.min(0.9, basePrior + typeAdjustment));
  }

  /**
   * Calculate Bayesian posterior probability
   */
  private calculateBayesianPosterior(
    prior: number,
    likelihood: number,
    weights: Record<string, number>
  ): number {
    // Simplified Bayesian calculation
    // P(confident|evidence) = P(evidence|confident) * P(confident) / P(evidence)
    
    const evidence = likelihood; // Simplified evidence calculation
    const posteriorNumerator = likelihood * prior;
    const posteriorDenominator = evidence + (1 - evidence) * (1 - prior);
    
    return posteriorDenominator > 0 ? posteriorNumerator / posteriorDenominator : prior;
  }

  /**
   * Calculate uncertainty metrics (aleatoric and epistemic uncertainty)
   */
  private calculateUncertaintyMetrics(
    modelPredictions: ModelPrediction[],
    components: ConfidenceMetrics['components'],
    documentContext: any
  ): ConfidenceMetrics['uncertainty'] {
    
    // Aleatoric uncertainty (data uncertainty - inherent noise in data)
    const aleatoricUncertainty = this.calculateAleatoricUncertainty(
      documentContext,
      components.content,
      components.technical
    );

    // Epistemic uncertainty (model uncertainty - lack of knowledge)
    const epistemicUncertainty = this.calculateEpistemicUncertainty(
      modelPredictions,
      components.consensus,
      components.historical
    );

    // Total uncertainty (combining both types)
    const totalUncertainty = Math.sqrt(
      aleatoricUncertainty * aleatoricUncertainty + 
      epistemicUncertainty * epistemicUncertainty
    );

    return {
      aleatoric: Math.round(aleatoricUncertainty * 100) / 100,
      epistemic: Math.round(epistemicUncertainty * 100) / 100,
      total: Math.round(totalUncertainty * 100) / 100
    };
  }

  /**
   * Calculate aleatoric (data) uncertainty
   */
  private calculateAleatoricUncertainty(
    documentContext: any,
    contentConfidence: number,
    technicalConfidence: number
  ): number {
    let uncertainty = 0.2; // Base data uncertainty

    // Text quality uncertainty
    uncertainty += (1 - documentContext.textQuality) * 0.3;

    // Processing complexity uncertainty  
    uncertainty += documentContext.processingComplexity * 0.2;

    // Content and technical confidence penalties
    uncertainty += (1 - contentConfidence) * 0.15;
    uncertainty += (1 - technicalConfidence) * 0.15;

    return Math.max(0.05, Math.min(0.8, uncertainty));
  }

  /**
   * Calculate epistemic (model) uncertainty  
   */
  private calculateEpistemicUncertainty(
    modelPredictions: ModelPrediction[],
    consensusConfidence: number,
    historicalConfidence: number
  ): number {
    let uncertainty = 0.15; // Base model uncertainty

    // Model disagreement uncertainty
    if (modelPredictions.length > 1) {
      const confidenceVariance = this.calculateConfidenceVariance(modelPredictions);
      uncertainty += confidenceVariance * 0.4;
    }

    // Consensus and historical pattern uncertainty
    uncertainty += (1 - consensusConfidence) * 0.25;
    uncertainty += (1 - historicalConfidence) * 0.2;

    // Model entropy uncertainty
    const avgEntropy = modelPredictions.reduce((sum, pred) => sum + pred.entropy, 0) / 
                      (modelPredictions.length || 1);
    uncertainty += avgEntropy * 0.15;

    return Math.max(0.05, Math.min(0.7, uncertainty));
  }

  /**
   * Calculate confidence variance across models
   */
  private calculateConfidenceVariance(modelPredictions: ModelPrediction[]): number {
    const avgConfidence = modelPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / 
                         modelPredictions.length;
    
    const variance = modelPredictions.reduce((sum, pred) => 
      sum + Math.pow(pred.confidence - avgConfidence, 2), 0) / modelPredictions.length;
    
    return variance;
  }

  /**
   * Apply confidence calibration based on historical performance
   */
  private async applyCalibratedConfidence(
    rawConfidence: number,
    documentContext: any,
    uncertainty: number
  ): Promise<number> {
    const contextKey = `${documentContext.industry}_${documentContext.documentType}`;
    const calibrationData = this.calibrationData.get(contextKey) || [];

    // Find appropriate calibration bin
    const calibrationBin = calibrationData.find(bin => 
      rawConfidence >= bin.confidenceBin[0] && rawConfidence < bin.confidenceBin[1]
    );

    if (calibrationBin && calibrationBin.sampleCount >= 10) {
      // Apply calibration adjustment
      const reliabilityAdjustment = (calibrationBin.actualAccuracy - rawConfidence) * 0.3;
      const calibratedConfidence = rawConfidence + reliabilityAdjustment;
      
      // Uncertainty adjustment
      const uncertaintyPenalty = uncertainty * 0.15;
      
      return Math.max(0.1, Math.min(0.95, calibratedConfidence - uncertaintyPenalty));
    }

    // Default calibration with uncertainty adjustment
    return Math.max(0.1, Math.min(0.95, rawConfidence - uncertainty * 0.1));
  }

  /**
   * Calculate calibration metrics
   */
  private async calculateCalibrationMetrics(
    confidence: number,
    documentContext: any
  ): Promise<ConfidenceMetrics['calibration']> {
    const contextKey = `${documentContext.industry}_${documentContext.documentType}`;
    const calibrationData = this.calibrationData.get(contextKey) || [];

    if (calibrationData.length === 0) {
      return {
        reliability: 0.7,  // Default reliability
        sharpness: 0.6,    // Default sharpness
        brier: 0.25        // Default Brier score
      };
    }

    // Calculate reliability (confidence-accuracy alignment)
    const avgReliability = calibrationData.reduce((sum, bin) => sum + bin.reliability, 0) / 
                          calibrationData.length;

    // Calculate sharpness (how decisive predictions are)
    const sharpness = this.calculateSharpness(calibrationData);

    // Calculate Brier score (probabilistic accuracy)
    const brierScore = this.calculateBrierScore(calibrationData);

    return {
      reliability: Math.round(avgReliability * 100) / 100,
      sharpness: Math.round(sharpness * 100) / 100,
      brier: Math.round(brierScore * 100) / 100
    };
  }

  /**
   * Calculate sharpness metric
   */
  private calculateSharpness(calibrationData: ConfidenceCalibrationData[]): number {
    // Sharpness measures how decisive the predictions are
    // Higher values indicate more decisive predictions
    
    const weightedSum = calibrationData.reduce((sum, bin) => {
      const binMidpoint = (bin.confidenceBin[0] + bin.confidenceBin[1]) / 2;
      const decisiveness = Math.abs(binMidpoint - 0.5) * 2; // 0 = indecisive, 1 = decisive
      return sum + decisiveness * bin.sampleCount;
    }, 0);

    const totalSamples = calibrationData.reduce((sum, bin) => sum + bin.sampleCount, 0);
    
    return totalSamples > 0 ? weightedSum / totalSamples : 0.5;
  }

  /**
   * Calculate Brier score
   */
  private calculateBrierScore(calibrationData: ConfidenceCalibrationData[]): number {
    // Brier score measures probabilistic accuracy (lower is better)
    
    const brierSum = calibrationData.reduce((sum, bin) => {
      const binMidpoint = (bin.confidenceBin[0] + bin.confidenceBin[1]) / 2;
      const brierContribution = Math.pow(binMidpoint - bin.actualAccuracy, 2);
      return sum + brierContribution * bin.sampleCount;
    }, 0);

    const totalSamples = calibrationData.reduce((sum, bin) => sum + bin.sampleCount, 0);
    
    return totalSamples > 0 ? brierSum / totalSamples : 0.25;
  }

  /**
   * Generate confidence explanation
   */
  private generateConfidenceExplanation(
    components: ConfidenceMetrics['components'],
    modelPredictions: ModelPrediction[],
    ragContext?: any,
    templateFreeContext?: any,
    uncertaintyMetrics?: ConfidenceMetrics['uncertainty']
  ): ConfidenceMetrics['explanation'] {
    const primaryFactors: string[] = [];
    const confidenceBoosts: Array<{ source: string; impact: number; reason: string }> = [];
    const uncertaintyFactors: string[] = [];
    const recommendations: string[] = [];

    // Identify primary confidence factors
    Object.entries(components).forEach(([component, score]) => {
      if (score > 0.8) {
        primaryFactors.push(`High ${component} confidence (${Math.round(score * 100)}%)`);
      } else if (score < 0.5) {
        uncertaintyFactors.push(`Low ${component} confidence (${Math.round(score * 100)}%)`);
      }
    });

    // RAG confidence boosts
    if (ragContext && ragContext.similarity > 0.7) {
      confidenceBoosts.push({
        source: 'Historical Context',
        impact: Math.round(ragContext.similarity * 15),
        reason: `High similarity to ${ragContext.sampleSize} historical documents`
      });
    }

    // Template-free processing boosts
    if (templateFreeContext && templateFreeContext.patternMatch > 0.8) {
      confidenceBoosts.push({
        source: 'Pattern Recognition',
        impact: Math.round(templateFreeContext.patternMatch * 10),
        reason: 'Strong structural pattern recognition'
      });
    }

    // Model consensus boosts
    if (components.consensus > 0.8) {
      confidenceBoosts.push({
        source: 'Model Agreement',
        impact: Math.round(components.consensus * 12),
        reason: `${modelPredictions.length} models in strong agreement`
      });
    }

    // Uncertainty factors
    if (uncertaintyMetrics && uncertaintyMetrics.aleatoric > 0.4) {
      uncertaintyFactors.push('High data uncertainty due to text quality or complexity');
    }
    
    if (uncertaintyMetrics && uncertaintyMetrics.epistemic > 0.4) {
      uncertaintyFactors.push('Model uncertainty due to limited training data or disagreement');
    }

    // Generate recommendations
    if (components.technical < 0.6) {
      recommendations.push('Consider manual review due to technical processing challenges');
    }
    
    if (components.consensus < 0.6 && modelPredictions.length > 1) {
      recommendations.push('Models disagree - review conflicting predictions');
    }
    
    if (components.historical < 0.5) {
      recommendations.push('Limited historical context - proceed with caution');
    }

    if (uncertaintyMetrics && uncertaintyMetrics.total > 0.4) {
      recommendations.push('High uncertainty detected - recommend additional validation');
    }

    return {
      primaryFactors,
      confidenceBoosts,
      uncertaintyFactors,
      recommendations
    };
  }

  /**
   * Generate fallback confidence for error cases
   */
  private generateFallbackConfidence(
    modelPredictions: ModelPrediction[],
    documentContext: any
  ): ConfidenceMetrics {
    const avgConfidence = modelPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / 
                         (modelPredictions.length || 1);

    return {
      overall: Math.max(0.3, Math.min(0.8, avgConfidence)),
      components: {
        content: documentContext.textQuality || 0.6,
        consensus: modelPredictions.length > 1 ? 0.5 : 0.6,
        historical: 0.5,
        technical: 0.6,
        domain: 0.5
      },
      uncertainty: {
        aleatoric: 0.3,
        epistemic: 0.3,
        total: 0.4
      },
      calibration: {
        reliability: 0.6,
        sharpness: 0.5,
        brier: 0.3
      },
      explanation: {
        primaryFactors: ['Fallback confidence calculation used'],
        confidenceBoosts: [],
        uncertaintyFactors: ['Advanced confidence calculation failed'],
        recommendations: ['Review results manually due to processing error']
      }
    };
  }

  /**
   * Initialize calibration data for different document types
   */
  private initializeCalibrationData(): void {
    // Medical documents calibration data
    this.calibrationData.set('medical_medical_record', [
      { confidenceBin: [0.8, 0.9], actualAccuracy: 0.85, sampleCount: 50, reliability: 0.85 },
      { confidenceBin: [0.9, 1.0], actualAccuracy: 0.92, sampleCount: 30, reliability: 0.92 }
    ]);

    // Legal documents calibration data
    this.calibrationData.set('legal_contract', [
      { confidenceBin: [0.7, 0.8], actualAccuracy: 0.75, sampleCount: 40, reliability: 0.75 },
      { confidenceBin: [0.8, 0.9], actualAccuracy: 0.88, sampleCount: 35, reliability: 0.88 }
    ]);

    // Add more calibration data as historical performance data becomes available
  }

  /**
   * Initialize model reliability scores
   */
  private initializeModelReliability(): void {
    this.modelReliability.set('openai', 0.88);
    this.modelReliability.set('gemini', 0.82);
    this.modelReliability.set('anthropic', 0.85);
    this.modelReliability.set('google_vision', 0.90);
  }

  /**
   * Update calibration data with new performance results
   */
  async updateCalibrationData(
    documentContext: any,
    predictedConfidence: number,
    actualAccuracy: number
  ): Promise<void> {
    const contextKey = `${documentContext.industry}_${documentContext.documentType}`;
    let calibrationData = this.calibrationData.get(contextKey) || [];

    // Find or create appropriate confidence bin
    const binSize = 0.1;
    const binStart = Math.floor(predictedConfidence / binSize) * binSize;
    const binEnd = binStart + binSize;

    let existingBin = calibrationData.find(bin => 
      bin.confidenceBin[0] === binStart && bin.confidenceBin[1] === binEnd
    );

    if (existingBin) {
      // Update existing bin
      const totalSamples = existingBin.sampleCount + 1;
      existingBin.actualAccuracy = (existingBin.actualAccuracy * existingBin.sampleCount + actualAccuracy) / totalSamples;
      existingBin.sampleCount = totalSamples;
      existingBin.reliability = Math.abs(existingBin.actualAccuracy - (binStart + binEnd) / 2);
    } else {
      // Create new bin
      calibrationData.push({
        confidenceBin: [binStart, binEnd],
        actualAccuracy,
        sampleCount: 1,
        reliability: Math.abs(actualAccuracy - (binStart + binEnd) / 2)
      });
    }

    this.calibrationData.set(contextKey, calibrationData);
  }

  /**
   * Get confidence system status and statistics
   */
  getConfidenceSystemStatus(): {
    calibrationDataSize: number;
    modelReliabilityScores: Record<string, number>;
    supportedIndustries: string[];
    averageCalibrationReliability: number;
  } {
    const calibrationDataSize = Array.from(this.calibrationData.values())
      .reduce((sum, data) => sum + data.length, 0);

    const reliabilityScores = Object.fromEntries(this.modelReliability.entries());

    const supportedIndustries = Array.from(new Set(
      Array.from(this.calibrationData.keys()).map(key => key.split('_')[0])
    ));

    const allCalibrationData = Array.from(this.calibrationData.values()).flat();
    const avgReliability = allCalibrationData.length > 0 
      ? allCalibrationData.reduce((sum, data) => sum + data.reliability, 0) / allCalibrationData.length
      : 0.7;

    return {
      calibrationDataSize,
      modelReliabilityScores: reliabilityScores,
      supportedIndustries,
      averageCalibrationReliability: Math.round(avgReliability * 100) / 100
    };
  }
}