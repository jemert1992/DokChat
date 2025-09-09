import React from 'react';

interface ExtractedDataDisplayProps {
  data: any;
}

const ExtractedDataDisplay: React.FC<ExtractedDataDisplayProps> = ({ data }) => {
  // Helper function to format AI results for display
  const formatAIResults = (results: any) => {
    if (!results) return [];

    const formattedData = [];

    // Extract OpenAI results
    if (results.openai) {
      const openai = results.openai;
      
      if (openai.summary) {
        formattedData.push({
          label: 'Document Summary',
          value: openai.summary,
          type: 'text'
        });
      }

      if (openai.keyEntities && openai.keyEntities.length > 0) {
        formattedData.push({
          label: 'Key Entities',
          value: openai.keyEntities.map((entity: any) => 
            `${entity.type}: ${entity.value} (${Math.round(entity.confidence * 100)}% confidence)`
          ).join(', '),
          type: 'entities'
        });
      }

      if (openai.compliance && openai.compliance.status) {
        formattedData.push({
          label: 'Compliance Status',
          value: openai.compliance.status,
          type: 'status'
        });
      }

      if (openai.compliance && openai.compliance.issues && openai.compliance.issues.length > 0) {
        formattedData.push({
          label: 'Compliance Issues',
          value: openai.compliance.issues.join(', '),
          type: 'issues'
        });
      }

      if (openai.insights && openai.insights.length > 0) {
        formattedData.push({
          label: 'AI Insights',
          value: openai.insights.join(', '),
          type: 'insights'
        });
      }
    }

    // Extract Gemini results
    if (results.gemini) {
      const gemini = results.gemini;
      
      if (gemini.summary) {
        formattedData.push({
          label: 'Alternative Summary (Gemini)',
          value: gemini.summary,
          type: 'text'
        });
      }

      if (gemini.sentiment) {
        formattedData.push({
          label: 'Document Sentiment',
          value: `${gemini.sentiment.rating}/5 stars (${Math.round(gemini.sentiment.confidence * 100)}% confidence)`,
          type: 'sentiment'
        });
      }

      if (gemini.insights && gemini.insights.length > 0) {
        formattedData.push({
          label: 'Additional Insights (Gemini)',
          value: gemini.insights.join(', '),
          type: 'insights'
        });
      }
    }

    // Extract consensus results
    if (results.consensus) {
      const consensus = results.consensus;
      
      if (consensus.summary) {
        formattedData.push({
          label: 'Consensus Summary',
          value: consensus.summary,
          type: 'consensus'
        });
      }

      if (consensus.keyFindings && consensus.keyFindings.length > 0) {
        formattedData.push({
          label: 'Key Findings',
          value: consensus.keyFindings.join(', '),
          type: 'findings'
        });
      }

      if (consensus.recommendedModel) {
        formattedData.push({
          label: 'Best Analysis Model',
          value: consensus.recommendedModel.toUpperCase(),
          type: 'model'
        });
      }
    }

    return formattedData;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'consensus':
        return '📄';
      case 'entities':
        return '🏷️';
      case 'status':
        return '✅';
      case 'issues':
        return '⚠️';
      case 'insights':
      case 'findings':
        return '💡';
      case 'sentiment':
        return '😊';
      case 'model':
        return '🤖';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consensus':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950';
      case 'entities':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950';
      case 'status':
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950';
      case 'issues':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950';
      case 'insights':
      case 'findings':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950';
      case 'sentiment':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950';
      case 'model':
        return 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950';
      default:
        return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950';
    }
  };

  const extractedItems = formatAIResults(data);

  if (extractedItems.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
        <p>No structured data extracted</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {extractedItems.map((item, index) => (
        <div key={index} className={`p-4 rounded-lg border ${getTypeColor(item.type)}`}>
          <div className="flex items-start space-x-3">
            <span className="text-lg">{getTypeIcon(item.type)}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {item.label}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExtractedDataDisplay;