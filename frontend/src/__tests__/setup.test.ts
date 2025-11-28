// Simple smoke test to verify Jest setup
describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to jest matchers', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
  });
});
