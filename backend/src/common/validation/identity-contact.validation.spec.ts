import {
  isValidIdentification,
  isValidPhone,
} from './identity-contact.validation';

describe('identity and contact validation', () => {
  it.each([
    ['123456789', true],
    ['023456789', false],
    ['12345678', false],
    ['1234567890', false],
    ['12345678a', false],
    ['1-2345-678', false],
    [' 123456789', false],
  ])('validates NATIONAL %s', (value, expected) => {
    expect(isValidIdentification('NATIONAL', value)).toBe(expected);
  });

  it.each([
    ['123456789012', true],
    ['12345678901', false],
    ['1234567890123', false],
    ['12345678901a', false],
    ['12345678901-', false],
  ])('validates DIMEX %s', (value, expected) => {
    expect(isValidIdentification('DIMEX', value)).toBe(expected);
  });

  it.each([
    ['+506', '88887777', true],
    ['+506', '8888a777', false],
    ['+506', '8888777', false],
    ['506', '88887777', false],
    ['+1234', '123456789012', false],
    ['+1', '2025550100', true],
  ])('validates phone %s %s', (code, number, expected) => {
    expect(isValidPhone(code, number)).toBe(expected);
  });
});
