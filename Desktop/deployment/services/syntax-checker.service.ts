import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export class SyntaxChecker {
  static async validateJavaScript(code: string, filename: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    // Create temp directory for checking
    const tmpDir = path.join(process.cwd(), 'tmp', 'autofix-syntax-check');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    // Ensure filename is safe and unique to avoid collisions
    const safeFilename = `${Date.now()}-${path.basename(filename)}`;
    const tmpFile = path.join(tmpDir, safeFilename);
    
    fs.writeFileSync(tmpFile, code);
    
    try {
      // Try to parse with Node.js (for .js/.jsx files)
      if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
        logger.info('🧪 [SyntaxChecker] Checking JS syntax', { filename });
        execSync(`node --check ${tmpFile}`, { stdio: 'pipe' });
      }
      
      // Try TypeScript compiler (for .ts/.tsx files)
      if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
        logger.info('🧪 [SyntaxChecker] Checking TS syntax', { filename });
        // Note: Simple check without full context, might miss some imports but catches basic syntax issues
        // Using --noEmit to just check syntax
        try {
          execSync(`npx tsc --noEmit --target ESNext --jsx react-jsx --module CommonJS ${tmpFile}`, { 
            stdio: 'pipe',
            cwd: process.cwd()
          });
        } catch (tscErr: any) {
          // If it's a "File not found" error for the npx command, we might need to handle it
          // But usually in this environment npx works.
          throw tscErr;
        }
      }
      
      return { valid: true, errors: [] };
      
    } catch (error: any) {
      const errorMsg = error.stderr?.toString() || error.message || 'Unknown syntax error';
      logger.error('❌ [SyntaxChecker] Syntax check failed', { 
        filename, 
        error: errorMsg.slice(0, 500) 
      });
      return { 
        valid: false, 
        errors: [errorMsg] 
      };
    } finally {
      // Cleanup
      try {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
    }
  }
}
