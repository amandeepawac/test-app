import { validateEnvironment } from './config.js';

describe('API configuration', () => {
  it('uses the default port or parses a configured port', () => {
    expect(validateEnvironment({}).PORT).toBe(3001);
    expect(validateEnvironment({ PORT: '4000' }).PORT).toBe(4000);
  });

  it.each(['', 'abc', '0', '65536', '3.5'])('rejects invalid port %s', (PORT) => {
    expect(() => validateEnvironment({ PORT })).toThrow('Invalid API configuration');
  });
});
