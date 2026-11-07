// Local jest-dom matcher type registration, hoisting-neutral: anchored in the
// frontend tree so 'vitest' resolves to the frontend's own dependency regardless
// of where npm hoists @testing-library/jest-dom in a workspace install.
import 'vitest';
import { type TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
