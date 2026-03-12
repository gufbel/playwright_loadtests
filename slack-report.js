const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config({ path: path.resolve(__dirname, 'config/.env') });

(async () => {
  const resultsPath = path.resolve(__dirname, 'test-results/results.json');
  if (!fs.existsSync(resultsPath)) {
    console.error('⚠️ results.json not found!');
    return;
  }
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

  // Flatten all tests + steps
  const summary = { total: 0, passed: 0, failed: 0, skipped: 0, details: [] };
  // Helper to traverse suites recursively
  function collectSpecs(suite, summary) {
    if (suite.specs) {
      suite.specs.forEach(spec => {
        spec.tests.forEach(test => {
          test.results.forEach(r => {
            summary.total++;
            if (r.status === 'passed') summary.passed++;
            else if (r.status === 'skipped') summary.skipped++;
            else summary.failed++;
            if (r.steps?.length) {
              r.steps.forEach(step => {
                summary.details.push({
                  test: spec.title,
                  step: step.title,
                  duration: step.duration,
                  status: r.status,
                  error: step.error?.message
                });
              });
            }
          });
        });
      });
    }
    if (suite.suites) suite.suites.forEach(child => collectSpecs(child, summary));
   }
   results.suites.forEach(suite => collectSpecs(suite, summary));

  // Compose Slack message
  let message = `:rocket: TUMA REMITTANCE ONBOARDING MOCK API REGRESSION REPORT\n`;
  message += `:stopwatch: Run Time: ${new Date().toISOString()}\n\n`;
  message += `:bar_chart: Summary\nTotal: ${summary.total}\nPassed: ${summary.passed} :white_check_mark:\nFailed: ${summary.failed} :x:\nSkipped: ${summary.skipped} :warning:\n\n`;
  
// Show top 5 failures only to keep Slack concise
  const failures = summary.details.filter(d => d.status !== 'passed').slice(0, 5);
  if (failures.length) {
    message += `:page_facing_up: Top Failures\n`;
    failures.forEach(d => {
      message += `• ${d.test} — ${d.step} — ${d.error || 'Unknown error'}\n`;
    });
    if (summary.details.filter(d => d.status !== 'passed').length > 5) {
      message += `• ...and more failures, see full report\n`;
    }
    message += `\n`;
  }
  // Show summary of steps for passed/skipped (optional)
  message += `:page_facing_up: Sample Steps\n`;

  // Always include at least one of the important steps
  const importantSteps = ['Onfido Applicant','Onfido Verification','SEON AML Check'];
  importantSteps.forEach(stepName => {
    const found = summary.details.find(d => d.step === stepName);
    if (found) {
      message += `• ${found.test} — ${found.step} — ${found.status.toUpperCase()} — ${found.duration}ms\n`;
    }
  });

  // Fill remaining slots randomly
  summary.details
    .sort(() => 0.5 - Math.random())
    .slice(0, 7)
    .forEach(d => {
      if (d.status === 'passed' || d.status === 'skipped') {
        message += `• ${d.test} — ${d.step} — ${d.status.toUpperCase()} — ${d.duration}ms\n`;
      }
    });

  // Performance metrics
  const perf = { 'Auth OTP': [], 'SMS Verify': [], 'Email Verify': [], 'Onfido Applicant': [], 'Onfido Verification': [], 'SEON AML Check': [] };
  summary.details.forEach(d => {
    if (perf[d.step]) perf[d.step].push(d.duration);
  });
  message += `\n:bar_chart: Performance\n`;
  Object.keys(perf).forEach(key => {
    const arr = perf[key];
    const avg = arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    message += `${key}: ${avg}ms avg\n`;
  });
  const thresholds = {
    'Auth OTP': 200,
    'SMS Verify': 200,
    'Email Verify': 200,
    'Onfido Applicant': 800,
    'Onfido Verification': 800,
    'SEON AML Check': 500
  };
  message += `\n:warning: Latency Alerts\n`;

    Object.keys(perf).forEach(step => {
      const arr = perf[step];
      const avg = arr.length
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;
      const threshold = thresholds[step];
      const alert = avg > threshold ? '⚠ EXCEEDED' : '✅ OK';
      message += `${step}: Avg = ${avg}ms, Threshold = ${threshold}ms — ${alert}\n`;
    });
  // Send to Slack
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return console.warn('⚠️ No Slack webhook configured');
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    if (!res.ok) throw new Error(await res.text());
    console.log('✅ Slack notification sent!');
  } catch (err) {
    console.error('❌ Slack notification failed:', err);
  }
})();
