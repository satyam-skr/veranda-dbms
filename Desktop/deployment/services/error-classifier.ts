import { OpenAIService } from './openai.service';
import { logger } from '../utils/logger';

/**
 * Error classification categories
 */
export type ErrorCategory = 
  | 'code_error'           // TypeScript errors, undefined variables, syntax errors
  | 'dependency_error'     // npm install failures, package conflicts
  | 'build_config_error'   // Invalid next.config, build command issues
  | 'environment_error'    // Missing env vars, secrets not configured
  | 'infrastructure_error' // Vercel platform issues, quota limits, permissions
  | 'unknown_error';       // Cannot determine

export interface ErrorClassification {
  category: ErrorCategory;
  isFixable: boolean;
  confidence: number; // 0-1
  reasoning: string;
  userActionRequired?: string; // What user needs to do for unfixable errors
  suggestedFix?: string; // Hint for fixable errors
}

/**
 * Intelligent error classifier using AI
 * Determines if deployment errors can be fixed by code changes or require user intervention
 */
export class ErrorClassifier {
  /**
   * Classify a deployment error from logs and optional AI analysis
   */
  async classifyError(
    logs: string,
    aiResponse?: any
  ): Promise<ErrorClassification> {
    try {
      logger.info('🔍 [Classifier] Starting error classification', {
        logsLength: logs.length,
        hasAiResponse: !!aiResponse,
      });

      // Build classification prompt
      const prompt = this.buildClassificationPrompt(logs, aiResponse);

      // Use OpenAI service
      logger.info('🤖 [Classifier] Calling OpenAI service...');
      const openAI = new OpenAIService();
      const parsed = await openAI.generateClassification(prompt);

      if (!parsed) {
        throw new Error('OpenAI returned no classification');
      }

      const classification: ErrorClassification = {
        category: parsed.category || 'unknown_error',
        isFixable: parsed.isFixable ?? true,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'No reasoning provided',
        userActionRequired: parsed.userActionRequired || undefined,
        suggestedFix: parsed.suggestedFix || undefined,
      };

      logger.info('✅ [Classifier] Error classified', {
        category: classification.category,
        isFixable: classification.isFixable,
        confidence: classification.confidence,
      });

      return classification;
    } catch (error) {
      logger.error('❌ [Classifier] Classification failed', {
        error: String(error),
      });

      // Default to unknown_error with low confidence
      return {
        category: 'unknown_error',
        isFixable: true, // Err on the side of attempting a fix
        confidence: 0.3,
        reasoning: `Classification failed: ${String(error)}. Defaulting to attempting fix.`,
      };
    }
  }

  /**
   * Build the classification prompt for AI
   */
  private buildClassificationPrompt(logs: string, aiResponse?: any): string {
    return `You are an expert deployment error classifier. Analyze the following deployment failure and classify it.

DEPLOYMENT LOGS:
\`\`\`
${logs.substring(0, 3000)} ${logs.length > 3000 ? '...(truncated)' : ''}
\`\`\`

${aiResponse ? `
AI ANALYSIS (if available):
Root Cause: ${aiResponse.rootCause || 'N/A'}
${aiResponse.filesToChange ? `Files to Change: ${aiResponse.filesToChange.length}` : ''}
` : ''}

Classify this error into ONE of these categories:

1. **code_error** - TypeScript/JavaScript syntax errors, undefined variables, import errors, logic bugs
   - Fixable: YES (can be fixed by code changes)
   - Examples: "Cannot find name 'foo'", "Unexpected token", "Module not found" (for local files)

2. **dependency_error** - npm/yarn package installation failures, version conflicts
   - Fixable: MAYBE (can try updating package.json, lock files)
   - Examples: "npm ERR!", "ERESOLVE could not resolve", "peer dependency"

3. **build_config_error** - Build configuration issues, framework misconfiguration
   - Fixable: YES (can fix config files)
   - Examples: Invalid next.config.js, wrong build command, missing scripts in package.json

4. **environment_error** - Missing environment variables, secrets, API keys
   - Fixable: NO (user must configure in Vercel dashboard)
   - Examples: "process.env.API_KEY is not defined", "Missing required environment variable"

5. **infrastructure_error** - Vercel platform issues, quota limits, permissions, network
   - Fixable: NO (platform or account issue)
   - Examples: "Build exceeded maximum duration", "Out of memory", "Rate limit exceeded", "Insufficient permissions"

6. **unknown_error** - Cannot determine from logs
   - Fixable: MAYBE (attempt fix as fallback)

Respond in this EXACT JSON format:
{
  "category": "one_of_the_categories_above",
  "isFixable": true or false,
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of why you classified it this way",
  "userActionRequired": "if unfixable, what specific action user needs to take (or null)",
  "suggestedFix": "if fixable, brief hint of what needs fixing (or null)"
}

Be conservative: if unsure between fixable and unfixable, choose unfixable to avoid wasting fix attempts.`;
  }

  /**
   * Parse AI classification response
   */
  private parseClassificationResponse(text: string): ErrorClassification {
    try {
      // Extract JSON from response (AI might add markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        category: parsed.category || 'unknown_error',
        isFixable: parsed.isFixable ?? true,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'No reasoning provided',
        userActionRequired: parsed.userActionRequired || undefined,
        suggestedFix: parsed.suggestedFix || undefined,
      };
    } catch (error) {
      logger.error('Failed to parse classification response', {
        error: String(error),
        text: text.substring(0, 500),
      });

      // Return safe default
      return {
        category: 'unknown_error',
        isFixable: true,
        confidence: 0.5,
        reasoning: 'Failed to parse classification response',
      };
    }
  }

  /**
   * Quick heuristic-based classification (faster, no AI call)
   * Use this for obvious cases to save API costs
   */
  async quickClassify(logs: string): Promise<ErrorClassification | null> {
    const logsLower = logs.toLowerCase();

    // Environment errors (high confidence)
    if (
      logsLower.includes('missing environment variable') ||
      logsLower.includes('env is not defined') ||
      logsLower.includes('process.env') && logsLower.includes('undefined')
    ) {
      return {
        category: 'environment_error',
        isFixable: false,
        confidence: 0.9,
        reasoning: 'Detected missing environment variable in logs',
        userActionRequired: 'Configure missing environment variables in Vercel project settings',
      };
    }

    // Infrastructure errors (high confidence)
    if (
      logsLower.includes('build exceeded maximum duration') ||
      logsLower.includes('out of memory') ||
      logsLower.includes('econnrefused') ||
      logsLower.includes('rate limit exceeded')
    ) {
      return {
        category: 'infrastructure_error',
        isFixable: false,
        confidence: 0.9,
        reasoning: 'Detected infrastructure/platform limitation',
        userActionRequired: 'Check Vercel account limits or contact support',
      };
    }

    // TypeScript/Import errors (high confidence fixable)
    if (
      logsLower.includes('error ts') ||
      logsLower.includes('cannot find name') ||
      logsLower.includes('type error') ||
      logsLower.includes('could not resolve') ||
      logsLower.includes('module not found') ||
      logsLower.includes('resolve error') ||
      logsLower.includes('transform failed') ||
      logsLower.includes('unexpected token') ||
      logsLower.includes('unexpected "') ||
      logsLower.includes('unexpected .') ||
      logsLower.includes('syntaxerror')
    ) {
      return {
        category: 'code_error',
        isFixable: true,
        confidence: 0.95,
        reasoning: 'Detected TypeScript/Import/Syntax error',
        suggestedFix: 'Fix syntax error or invalid import',
      };
    }

    // Command not found (Dependency error)
    if (
      logsLower.includes('command not found') ||
      logsLower.includes('sh: line 1:') 
    ) {
      return {
        category: 'dependency_error',
        isFixable: true,
        confidence: 0.95,
        reasoning: 'Detected missing shell command/binary (likely missing dependency)',
        suggestedFix: 'Add the missing package (e.g., vite, next) to package.json dependencies or devDependencies',
      };
    }

    // Not obvious - let AI decide
    return null;
  }
}
