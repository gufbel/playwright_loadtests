import { test, expect, request } from '@playwright/test';

test.describe.parallel('Onboarding load test', () => {
  for (let i = 1; i <= 100; i++) {
    test(`User ${i}`, async () => {
      const api = await request.newContext({ baseURL: 'http://localhost:4000' });
      const onfido = await request.newContext({ baseURL: 'http://localhost:3000' });
      const seonApi = await request.newContext({ baseURL: 'http://localhost:6000' });

      // Generate random data
      const phone = `+44${Math.floor(7000000000 + Math.random() * 100000000)}`;
      const email = `user${i}@example.com`;
      const firstName = `Test${i}`;
      const lastName = `User${i}`;

      // Optional: implement runStep utility from your existing spec
      let skipRemaining = false;
      const runStep = async (title: string, fn: () => Promise<void>) => {
        if (skipRemaining) return;
        try { await test.step(title, fn); } 
        catch (err: any) { skipRemaining = true; throw new Error(`${title} FAILED: ${err.message}`); }
      };

      await runStep('Phone Validation', async () => {
        if (!phone.startsWith('+44')) throw new Error('Not a UK number');
      });

      await runStep('Auth OTP', async () => {
        const auth = await api.post('/api/auth/otp', { data: { phone, code: '000000' } });
        expect(auth.ok()).toBeTruthy();
      });

      // ...continue all steps (SMS, Email, Onfido, SEON)
    });
  }
});
