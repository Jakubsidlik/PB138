import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test.describe('Study Plan - full user journey', () => {
  test('create study plan → subject → note → like the note', async ({ page, browserName }) => {
    test.setTimeout(90000);
    const suffix = Date.now();
    const planName = `E2E Plán ${suffix}`;
    const subjectName = `E2E Předmět ${suffix}`;
    const noteText = `E2E poznámka ${suffix}`;

    // ── 0. Autentizace a Hydratace ─────────────────────────────────────────────
    await page.goto('/');

    // Safari (WebKit) blokuje third-party cookies z global.setup.ts, 
    // provedeme proto explicitní Clerk přihlášení přímo v kontextu testu.
    if (browserName === 'webkit' && process.env.E2E_TEST_EMAIL) {
      try {
        await clerk.signIn({ page, emailAddress: process.env.E2E_TEST_EMAIL });
      } catch (error: any) {
        if (!error.message?.includes("You're already signed in")) {
          throw error;
        }
      }

      await page.reload();
    }

    // Clerk na pozadí odesílá telemetrii a session heartbeat, kvůli čemuž 
    // stav 'networkidle' (kompletní klid sítě) často nikdy nenastane a test spadne. 
    // Spolehlivější je počkat, než React aplikaci hydratuje a uloží session:
    await page.waitForFunction(() => window.localStorage.getItem('pb138-auth-session') !== null);

    // ── 1. Navigate to Study Plan ──────────────────────────────────────────────
    await page.getByRole('link', { name: /Studijní plán/i }).click();
    await page.waitForURL('**/study');
    await expect(page.getByRole('heading', { name: /Moje Studijní Plány/i })).toBeVisible();

    // ── 2. Create a new study plan ────────────────────────────────────────────
    await page.getByText('+ Nový studijní plán').click();
    // Zúžíme výběr pouze na konkrétní dialog, aby se Playwright nezasekl o Toast notifikaci
    const createPlanDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: /Nový studijní plán/i }) });
    await expect(createPlanDialog.getByRole('heading', { name: /Nový studijní plán/i })).toBeVisible();

    // Jakmile test běží na 100 % hydratované aplikaci, obyčejný fill() je naprosto bezpečný a mnohem rychlejší
    await createPlanDialog.locator('input').nth(0).fill(planName);

    // Intercept the plan creation API response
    const planResponse = page.waitForResponse(r => r.url().includes('/api/study-plans') && r.request().method() === 'POST');
    await createPlanDialog.getByRole('button', { name: /Vytvořit/i }).click();
    const planRes = await planResponse;

    // Validace, že se request na pozadí skutečně povedl. Pokud ne, test rovnou vypíše chybový kód.
    if (planRes.status() !== 201) {
      console.log('API Error:', await planRes.text());
    }
    expect(planRes.status()).toBe(201);
    const planData = await planRes.json();
    const createdPlanId: number = planData.id;
    console.log('Created plan ID:', createdPlanId);

    // Wait for dialog to close and plan to appear
    await expect(createPlanDialog).toBeHidden({ timeout: 8000 });

    // Nastavíme exact: true, aby se zamezilo kliknutí na nepřesný text nebo mizející upozornění
    const planCard = page.getByText(planName, { exact: true }).last();
    await expect(planCard).toBeVisible({ timeout: 10000 });

    // ── 3. Select the newly created plan ─────────────────────────────────────
    await planCard.click();
    // Wait until plan is active – "+ Zapsat předmět" appears only then
    await expect(page.getByText('+ Zapsat předmět')).toBeVisible({ timeout: 10000 });

    // ── 4. Create a new subject inside the plan ───────────────────────────────
    await page.getByText('+ Zapsat předmět').click();
    const createSubjectDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: /Nový předmět/i }) });
    await expect(createSubjectDialog.getByRole('heading', { name: /Nový předmět/i })).toBeVisible();

    await createSubjectDialog.locator('input').nth(0).fill(subjectName);
    await createSubjectDialog.locator('input').nth(1).fill('Doc. Test');
    await createSubjectDialog.locator('input').nth(2).fill(`E2E${suffix.toString().slice(-4)}`);

    // Intercept the subject creation API response
    const subjectResponse = page.waitForResponse(r => r.url().includes('/api/subjects') && r.request().method() === 'POST');
    await createSubjectDialog.getByRole('button', { name: /Zapsat/i }).click();
    const subjectRes = await subjectResponse;
    const subjectData = await subjectRes.json();
    console.log('Created subject:', JSON.stringify(subjectData));
    expect(subjectRes.status()).toBe(201);

    // Wait for dialog to close
    await expect(createSubjectDialog).toBeHidden({ timeout: 8000 });

    // Subject card should now appear (it might need a moment for the list to refresh)
    await expect(page.getByText(subjectName)).toBeVisible({ timeout: 15000 });

    // ── 5. Open the subject detail modal ─────────────────────────────────────
    await page.getByText(subjectName).first().click();
    const subjectModal = page.getByRole('dialog');
    await expect(subjectModal).toBeVisible({ timeout: 8000 });

    // ── 6. Add a note inside the subject ─────────────────────────────────────
    const noteInput = subjectModal.getByPlaceholder(/Napište rychlou poznámku k předmětu/i);
    await noteInput.fill(noteText);
    await subjectModal.getByRole('button', { name: 'Přidat', exact: true }).click();

    await expect(subjectModal.getByText(noteText)).toBeVisible({ timeout: 10000 });

    // ── 7. Like the note ──────────────────────────────────────────────────────
    const noteContainer = subjectModal.locator('div').filter({ hasText: noteText }).last();
    await noteContainer.locator('button').first().click();
    await expect(noteContainer.getByText('1', { exact: true })).toBeVisible({ timeout: 8000 });
  });
});
