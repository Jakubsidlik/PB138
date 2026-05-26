import { webkit, FullConfig } from '@playwright/test';
import { clerkSetup, clerk } from '@clerk/testing/playwright';
import * as fs from 'fs';

async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL;

  // Ensure directories exist
  if (!fs.existsSync('playwright/.auth')) fs.mkdirSync('playwright/.auth', { recursive: true });

  if (!email || !process.env.CLERK_SECRET_KEY) {
    console.warn('\n⚠️ E2E_TEST_EMAIL or CLERK_SECRET_KEY not set.');
    console.warn('⚠️ Tests will run without pre-authentication.\n');
    fs.writeFileSync('playwright/.auth/user.json', JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  try {
    console.log('Setting up Clerk Testing Token...');
    // This connects to Clerk API using CLERK_SECRET_KEY and prepares the environment
    await clerkSetup();

    const browser = await webkit.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log(`Authenticating for E2E tests via API for ${email}...`);
    // Navigate to a non-protected page first (or root, which redirects to login)
    await page.goto('http://localhost:5173/');
    
    // Use the official @clerk/testing package to bypass UI completely
    // This injects the testing token and signs in the user programmatically
    await clerk.signIn({ page, emailAddress: email });
    
    // Navigate to the protected page to trigger the authenticated state in the app
    await page.goto('http://localhost:5173/');
    
    // Wait for the application to load the authenticated state
    await page.waitForURL('http://localhost:5173/', { timeout: 15000 }).catch(() => null);
    await page.getByText('Hlavní stránka', { exact: false }).first().waitFor({ state: 'visible', timeout: 15000 });
    
    console.log('✅ API Authentication successful. Saving state...');
    
    // Save state
    await context.storageState({ path: 'playwright/.auth/user.json' });
    await browser.close();
  } catch (error) {
    console.error('❌ Failed to authenticate via Clerk API in global setup:', error);
    fs.writeFileSync('playwright/.auth/user.json', JSON.stringify({ cookies: [], origins: [] }));
  }
}

export default globalSetup;
