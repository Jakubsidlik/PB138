import { chromium, FullConfig } from '@playwright/test';
import { clerkSetup, clerk } from '@clerk/testing/playwright';
import * as fs from 'fs';

async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL;

  if (!fs.existsSync('playwright/.auth')) fs.mkdirSync('playwright/.auth', { recursive: true });

  if (!email || !process.env.CLERK_SECRET_KEY) {
    console.warn('\n⚠️ E2E_TEST_EMAIL or CLERK_SECRET_KEY not set.');
    console.warn('⚠️ Tests will run without pre-authentication.\n');
    fs.writeFileSync('playwright/.auth/user.json', JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  try {
    console.log('Setting up Clerk Testing Token...');
    await clerkSetup();

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log(`Authenticating for E2E tests via API for ${email}...`);
    await page.goto('http://localhost:5173/');
    
    await clerk.signIn({ page, emailAddress: email });
    
    await page.goto('http://localhost:5173/');
    
    await page.waitForURL('http://localhost:5173/', { timeout: 15000 }).catch(() => null);
    await page.getByText('Hlavní stránka', { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 });
    
    console.log('✅ API Authentication successful. Saving state...');
    
    await context.storageState({ path: 'playwright/.auth/user.json' });
    await browser.close();
  } catch (error) {
    console.error('❌ Failed to authenticate via Clerk API in global setup:', error);
    fs.writeFileSync('playwright/.auth/user.json', JSON.stringify({ cookies: [], origins: [] }));
  }
}

export default globalSetup;
