import { supabaseAdmin } from './supabase';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

/**
 * Encrypt a token using Supabase pgcrypto
 */
export async function encryptToken(token: string): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.rpc('encrypt_token', {
      token,
      encryption_key: ENCRYPTION_KEY
    });

    if (error) {
      console.error('Encryption error:', error);
      throw new Error(`Failed to encrypt token: ${error.message}`);
    }

    return data as string;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt a token using Supabase pgcrypto
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.rpc('decrypt_token', {
      encrypted_token: encryptedToken,
      encryption_key: ENCRYPTION_KEY
    });

    if (error) {
      console.error('Decryption error:', error);
      throw new Error(`Failed to decrypt token: ${error.message}`);
    }

    if (!data) {
      throw new Error('Decryption returned null - invalid encryption key or corrupted data');
    }

    return data as string;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}
