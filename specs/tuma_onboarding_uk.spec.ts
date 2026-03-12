import { test, expect, request } from '@playwright/test';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync('./test_data/onboarding.csv');
const users = parse(csv, { columns: true, skip_empty_lines: true });
const thresholds = require('../config/performance-thresholds');

for (const user of users) {
  test(`Onboarding ${user.phone}`, async () => {
    const api = await request.newContext({ baseURL: 'http://localhost:4000' });
    let token = '';
    const onfido = await request.newContext({ baseURL: 'http://localhost:3000' });
    const seonApi = await request.newContext({ baseURL: 'http://localhost:6000' });

    // Track whether a previous step failed
    let skipRemaining = false;

    // Utility to run steps safely
    const runStep = async (title: string, fn: () => Promise<void>) => {
      if (skipRemaining) {
        test.info().annotations.push({ type: 'skipped', description: title });
        console.log(`⚠️ Skipped step: ${title}`);
        return;
      }
      try {
        await test.step(title, fn);
      } catch (err: any) {
        skipRemaining = true;
        throw new Error(`${title} FAILED: ${err.message}`);
      }
    };

    // STEP 0 VALIDATE UK PHONE
    await runStep('Phone Validation', async () => {
      if (!user.phone.startsWith('+44')) {
        throw new Error('Not a UK number');
      }
    });

    // STEP 1 AUTH OTP
    await runStep('Auth OTP', async () => {
      const start = Date.now();
      const auth = await api.post('/api/auth/otp', {
        data: { phone: user.phone, code: '000000' },
      });
      const duration = Date.now() - start;
      expect(auth.ok()).toBeTruthy();
      if (duration > thresholds['Auth OTP']) {
        throw new Error(`Auth OTP latency regression: ${duration}ms`);
      }
      const authData = await auth.json();
      token = authData.accessToken;
      expect(token).toBeTruthy();
    });

    // STEP 2 VERIFY SMS
    await runStep('SMS Verify', async () => {
      const start = Date.now();
      const verify = await api.post('/api/account/otp-sms/verify', {
        headers: { Authorization: `Bearer ${token}` },
        data: { phoneNumber: user.phone, code: '000000' },
      });
      const duration = Date.now() - start;
      expect(verify.ok()).toBeTruthy();
      if (duration > thresholds['Auth OTP']) {
        throw new Error(`Auth OTP latency regression: ${duration}ms`);
      }
      const verifyData = await verify.json();
      expect(verifyData.status).toBe(true);
    });

    // STEP 3 VERIFY EMAIL
    await runStep('Email Verify', async () => {
      const start = Date.now();
      const emailVerify = await api.post('/api/account/otp-email/verify', {
        headers: { Authorization: `Bearer ${token}` },
        data: { email: user.email, code: '000000' },
      });
      const duration = Date.now() - start;
      expect(emailVerify.ok()).toBeTruthy();
      if (duration > thresholds['Auth OTP']) {
        throw new Error(`Auth OTP latency regression: ${duration}ms`);
      }
    });

    // STEP 4 ONFIDO APPLICANT
    await runStep('Onfido Applicant', async () => {
      const start = Date.now();
      const onfidoApplicant = await onfido.post('/mock/onfido/applicant', {
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
      const duration = Date.now() - start;
      expect(onfidoApplicant.ok()).toBeTruthy();
      if (duration > thresholds['Auth OTP']) {
        throw new Error(`Auth OTP latency regression: ${duration}ms`);
      }
      const applicant = await onfidoApplicant.json();
      expect(applicant.applicantId).toBeTruthy();
    });

    // STEP 5 ONFIDO VERIFICATION
    await runStep('Onfido Verification', async () => {
      const onfidoVerify = await onfido.post('/mock/onfido/verify', {
        data: { phone: user.phone },
      });
      expect(onfidoVerify.ok()).toBeTruthy();
      const verify = await onfidoVerify.json();
      expect(verify.status).toBe('verified');
    });

    // STEP 6 SEON AML CHECK
    await runStep('SEON AML Check', async () => {
      const seon = await seonApi.post('/mock/seon/check', {
        data: { email: user.email, phone: user.phone },
      });
      expect(seon.ok()).toBeTruthy();
      const seonData = await seon.json();
      expect(seonData.status).toBe('approved');
    });
  });
}
