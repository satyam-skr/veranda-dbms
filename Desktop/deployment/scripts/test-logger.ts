const { logger } = require('../utils/logger');

console.log('--- Testing Logger ---');
logger.info('Test info message', { userId: '123' });
logger.error('Test error message', { error: 'Something went wrong', stack: 'Error: ...' });
console.log('--- End Test ---');
