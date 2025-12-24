/**
 * Luna AI Response Engine
 * Temporary implementation using KB-based responses
 * TODO: Replace with actual Emergent LLM integration once endpoint is confirmed
 */

import { searchKnowledgeBase } from './knowledgeBase.js';

/**
 * Generate AI response based on user question and KB context
 * This is a placeholder implementation until Emergent LLM endpoint is confirmed
 */
export async function generateLunaResponse(userMessage, formContext = {}) {
  try {
    // Search knowledge base for relevant information
    const kbResults = await searchKnowledgeBase(userMessage, 3);
    
    // Build response based on KB results
    if (kbResults.length > 0) {
      const topResult = kbResults[0];
      
      // Create a contextual response
      let response = `Based on our knowledge base:\n\n`;
      response += `${topResult.content}\n\n`;
      
      if (kbResults.length > 1) {
        response += `\n**Related Topics:**\n`;
        kbResults.slice(1).forEach((result, index) => {
          response += `${index + 1}. ${result.title}\n`;
        });
      }
      
      // Add contextual help based on form stage
      if (formContext.currentStage) {
        response += `\n\nYou're currently on Stage ${formContext.currentStage} of the onboarding process. `;
        
        if (formContext.currentStage === 2 && formContext.hasABN) {
          response += `Since you have an ABN, make sure to have it ready for this section.`;
        } else if (formContext.currentStage === 3) {
          response += `This section covers your business details and GST registration.`;
        }
      }
      
      response += `\n\nIs there anything specific you'd like to know more about?`;
      
      return {
        content: response,
        sources: kbResults.map(r => ({ title: r.title, category: r.category }))
      };
    }
    
    // Fallback response when no KB match
    return {
      content: generateFallbackResponse(userMessage, formContext),
      sources: []
    };
    
  } catch (error) {
    console.error('Error generating Luna response:', error);
    throw error;
  }
}

/**
 * Generate a helpful fallback response when KB doesn't have relevant info
 */
function generateFallbackResponse(userMessage, formContext) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Common questions and responses
  if (lowerMessage.includes('tfn') || lowerMessage.includes('tax file number')) {
    return `Your Tax File Number (TFN) is a unique 9-digit number issued by the ATO. It's required for tax and superannuation purposes in Australia. We encrypt and securely store your TFN using industry-standard encryption.\n\nNeed help finding your TFN? You can locate it on previous tax returns, PAYG summaries, or contact the ATO on 13 28 61.`;
  }
  
  if (lowerMessage.includes('abn') || lowerMessage.includes('business number')) {
    return `An Australian Business Number (ABN) is an 11-digit number that uniquely identifies your business to the government and community. You need an ABN if you're carrying on an enterprise or business activity in Australia.\n\nKey requirements for an ABN:\n• Carrying on an enterprise\n• Making supplies connected with Australia\n• Intention to make a profit\n• Repetition and regularity of activities\n\nYou can apply for an ABN at abr.gov.au.`;
  }
  
  if (lowerMessage.includes('gst')) {
    return `Goods and Services Tax (GST) is a 10% tax on most goods, services, and other items sold or consumed in Australia.\n\nYou must register for GST if:\n• Your business has a GST turnover of $75,000 or more ($150,000 or more for non-profit organizations)\n\nYou can choose to register if your turnover is less than the threshold. Benefits include claiming GST credits on business purchases.`;
  }
  
  if (lowerMessage.includes('how long') || lowerMessage.includes('time')) {
    return `The onboarding process typically takes 8-10 minutes to complete. We've designed it to be conversational and easy to follow.\n\nYou can save your progress and return later if needed. Once submitted, we'll review your information and be in touch within 1-2 business days.`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
    return `I'm here to help! You can ask me about:\n\n• Tax File Numbers (TFN)\n• Australian Business Numbers (ABN)\n• GST registration\n• The onboarding process\n• Required documents\n• Bank details and security\n\nWhat specific question do you have?`;
  }
  
  // Generic helpful response
  return `I'm Luna, your FDC Tax assistant. I can help answer questions about the onboarding process, ABN, GST, and tax matters.\n\nWhile I don't have specific information about "${userMessage}" in my knowledge base right now, I'm here to help! \n\nYou can also contact FDC Tax directly:\n📧 Email: hello@fdctax.com.au\n📞 Phone: (during business hours)\n\nIs there something else I can help you with?`;
}
