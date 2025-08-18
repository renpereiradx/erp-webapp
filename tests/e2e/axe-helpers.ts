import { Page } from '@playwright/test';

export const injectAxe = async (page: Page) => {
  try {
    const axeModule: any = await import('@axe-core/playwright');
    const inject = axeModule.injectAxe || (axeModule.default && axeModule.default.injectAxe) || axeModule.default;
    if (typeof inject === 'function') return inject(page);
    throw new Error('injectAxe not available from @axe-core/playwright');
  } catch (err) {
    // rethrow so callers can fallback
    throw err;
  }
};

export const checkA11y = async (page: Page, options?: any, extra?: any) => {
  try {
    const axeModule: any = await import('@axe-core/playwright');
    const check = axeModule.checkA11y || (axeModule.default && axeModule.default.checkA11y) || axeModule.default;
    if (typeof check === 'function') return check(page, options ?? {}, extra ?? {});
    throw new Error('checkA11y not available from @axe-core/playwright');
  } catch (err) {
    throw err;
  }
};
