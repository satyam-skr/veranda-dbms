/**
 * File whitelist validation - only allow safe files to be modified
 */
const ALLOWED_FILE_PATTERNS = [
  /^src\/.+\.(ts|tsx|js|jsx|css|json)$/,
  /^next\.config\.(ts|js)$/,
  /^package\.json$/,
  /^tsconfig\.json$/,
  /^\.eslintrc(\.(js|json))?$/,
  /^middleware\.(ts|js)$/,
  /^tailwind\.config\.(ts|js)$/,
];

const FORBIDDEN_FILES = [
  /^\.env/,
  /^\.git\//,
  /^node_modules\//,
  /^\.next\//,
  /^dist\//,
  /^build\//,
];

export function validateFilename(filename: string): boolean {
  // Check if file is forbidden
  for (const pattern of FORBIDDEN_FILES) {
    if (pattern.test(filename)) {
      return false;
    }
  }

  // Check if file matches allowed patterns
  for (const pattern of ALLOWED_FILE_PATTERNS) {
    if (pattern.test(filename)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate code changes for dangerous patterns
 */
const DANGEROUS_PATTERNS = [
  { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/, reason: 'child_process usage detected' },
  { pattern: /import.*from\s*['"]child_process['"]/, reason: 'child_process import detected' },
  { pattern: /exec\s*\(/, reason: 'exec() function call detected' },
  { pattern: /eval\s*\(/, reason: 'eval() function detected' },
  { pattern: /new\s+Function\s*\(/, reason: 'Function constructor detected' },
  { pattern: /rm\s+-rf/, reason: 'dangerous shell command detected' },
  { pattern: /process\.env\.\w+\s*=/, reason: 'environment variable write detected' },
  { pattern: /fs\.unlink|fs\.rmdir|fs\.rm\b/, reason: 'file deletion operation detected' },
];

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateCodeChanges(newCode: string): ValidationResult {
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(newCode)) {
      return {
        isValid: false,
        reason,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate entire AI fix response
 */
export function validateAIResponse(filesToChange: Array<{ filename: string; newCode: string }>): ValidationResult {
  // Validate all filenames
  for (const file of filesToChange) {
    if (!validateFilename(file.filename)) {
      return {
        isValid: false,
        reason: `File not in whitelist: ${file.filename}`,
      };
    }
  }

  // Validate all code changes
  for (const file of filesToChange) {
    const codeValidation = validateCodeChanges(file.newCode);
    if (!codeValidation.isValid) {
      return {
        isValid: false,
        reason: `Dangerous code in ${file.filename}: ${codeValidation.reason}`,
      };
    }
  }

  return { isValid: true };
}
