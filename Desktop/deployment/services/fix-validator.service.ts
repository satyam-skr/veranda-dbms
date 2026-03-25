import { logger } from '../utils/logger';

export interface FixValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  reason?: 'no_change' | 'empty_fix' | 'syntax_error' | 'merge_conflict' | 'valid';
  details?: string;
}

export class FixValidator {
  /**
   * Validate AI-generated fix before committing
   *
   * IMPORTANT:
   * - Validation is RELAXED to avoid false rejections
   * - We only check for empty code, exact duplicates, and merge conflicts
   * - Syntax validation is REMOVED (bundler will catch actual errors)
   * - Returns structured error with reason codes for debugging
   */
  static async validateFix(
    filePath: string,
    oldCode: string | undefined,
    newCode: string,
    _repoRoot: string,
    currentContent: string,
    _checkFileExists?: (path: string) => Promise<boolean>
  ): Promise<FixValidationResult> {
    console.log('\n' + '✓'.repeat(40));
    console.log('✓ [Validator] STARTING VALIDATION');
    console.log(`✓ Original: ${currentContent.length} chars`);
    console.log(`✓ New Code: ${newCode.length} chars`);

    const errors: string[] = [];
    const warnings: string[] = [];
    let reason: FixValidationResult['reason'] = 'valid';
    let details = '';

    logger.info('🔍 [FixValidator] Starting fix validation', { filePath });

    // 1️⃣ Empty or missing content check
    if (!newCode || newCode.trim().length === 0) {
      errors.push('New code is empty');
      reason = 'empty_fix';
      details = 'AI returned empty or whitespace-only code';
      logger.warn('🔍 [FixValidator] REJECTED - Empty fix', { filePath });
    }

    // 2️⃣ NO-OP detection - ONLY reject if EXACTLY identical (no fuzzy matching)
    // Check against both oldCode and currentContent
    const trimmedNew = newCode.trim();
    const trimmedOld = oldCode?.trim() || '';
    const trimmedCurrent = currentContent?.trim() || '';
    
    if (trimmedNew === trimmedOld || trimmedNew === trimmedCurrent) {
      errors.push('New code is identical to existing code');
      reason = 'no_change';
      details = 'Generated fix produces no actual changes';
      logger.warn('🔍 [FixValidator] REJECTED - No-op fix', { filePath });
    }

    // 3️⃣ Merge conflict markers check (only real syntax issue we check)
    if (
      newCode.includes('<<<<<<<') ||
      newCode.includes('>>>>>>>') ||
      newCode.includes('=======')
    ) {
      errors.push('Merge conflict markers detected');
      reason = 'merge_conflict';
      details = 'Code contains unresolved merge conflict markers';
      logger.warn('🔍 [FixValidator] REJECTED - Merge conflict', { filePath });
    }

    // 4️⃣ SAFEGUARD #2: Shrinking File Safety Net
    const originalLength = currentContent?.length || 0;
    const fixedLength = newCode.length;
    
    if (originalLength > 0) {
      const shrinkagePercent = ((originalLength - fixedLength) / originalLength) * 100;
      console.log(`📏 [Validator] Size change: ${shrinkagePercent > 0 ? '-' : '+'}${Math.abs(shrinkagePercent).toFixed(1)}%`);

      if (shrinkagePercent > 50) {
        errors.push('File shrinkage detected');
        reason = 'empty_fix'; // Or a new type if we want, but 'empty_fix' triggers retry
        details = `AI returned file 50%+ smaller (${originalLength} → ${fixedLength} chars). Likely hallucinated "..." instead of full code.`;
        logger.warn('🔍 [FixValidator] REJECTED - Significant shrinkage', { 
          filePath, 
          originalLength, 
          fixedLength, 
          shrinkagePercent: shrinkagePercent.toFixed(2) 
        });
      }

      // Also reject if suspiciously short
      if (originalLength > 100 && fixedLength < 50) {
        errors.push('Suspiciously short code');
        reason = 'empty_fix';
        details = 'Fixed file is too short compared to original';
        logger.warn('🔍 [FixValidator] REJECTED - Suspiciously short', { filePath, originalLength, fixedLength });
      }
    }

    // ❌ REMOVED: Arbitrary character minimum (was 50 chars)
    // ❌ REMOVED: Syntax validation (too aggressive, rejects valid snippets)
    // ❌ REMOVED: Import path validation (bundler handles this)

    const isValid = errors.length === 0;

    logger.info('🔍 [FixValidator] Validation complete', {
      isValid,
      reason,
      errors,
      warnings,
      codeLength: newCode.length,
    });

    return {
      isValid,
      errors,
      warnings,
      reason: isValid ? 'valid' : reason,
      details: isValid ? 'Fix passed validation' : details,
    };
  }
}
