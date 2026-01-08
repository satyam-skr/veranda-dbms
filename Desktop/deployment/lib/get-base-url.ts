import { headers } from 'next/headers';

/**
 * Dynamically get the base URL for the application
 * Works in both development and production environments
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
