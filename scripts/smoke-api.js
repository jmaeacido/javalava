'use strict';

function parseArgs(argv) {
  const args = { dryRun: false, help: false, base: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--base' && argv[i + 1]) {
      args.base = argv[++i];
    }
  }
  return args;
}

function resolveBaseUrl(explicit) {
  const raw = explicit || process.env.SMOKE_API_BASE || process.env.SITE_URL || 'http://localhost:3000';
  return String(raw).replace(/\/+$/, '');
}

function buildCases(stamp) {
  const email = process.env.SMOKE_TEST_EMAIL || `smoke+${stamp}@example.com`;
  const iso = new Date(stamp).toISOString();

  return [
    {
      name: 'contact',
      path: '/api/contact',
      okStatuses: [200, 502],
      body: {
        firstName: 'Smoke',
        lastName: 'Test',
        email,
        subject: 'General enquiry',
        message: `API smoke test contact submission (${iso})`,
        source: 'api-smoke-test'
      }
    },
    {
      name: 'newsletter',
      path: '/api/newsletter',
      okStatuses: [200, 502],
      body: {
        email,
        source: 'api-smoke-test'
      }
    },
    {
      name: 'merch-notify',
      path: '/api/merch-notify',
      okStatuses: [200, 502],
      body: {
        email,
        productId: 'java-lava-midnight-roast-tee',
        productTitle: 'Java Lava Midnight Roast Tee',
        size: 'M',
        quantity: 1,
        price: '$32',
        source: 'api-smoke-test'
      }
    }
  ];
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'java-lava-api-smoke-test'
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { raw: text };
  }

  return { status: response.status, data };
}

function printHelp() {
  console.log(`Java Lava API smoke test

Usage:
  node scripts/smoke-api.js [--base URL] [--dry-run]

Options:
  --base URL   API origin (default: SMOKE_API_BASE, SITE_URL, or http://localhost:3000)
  --dry-run    Print requests only; do not POST
  --help       Show this help

Environment:
  SMOKE_API_BASE   Base URL for /api/* routes (e.g. http://localhost:3000)
  SMOKE_TEST_EMAIL Optional fixed test email (default: smoke+<timestamp>@example.com)

Notes:
  - Creates real Supabase rows tagged source=api-smoke-test.
  - May send emails when SMTP is configured (502 still means the row saved).
  - Run against local Vercel dev: npm run dev:api (from project root)
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const stamp = Date.now();
  const base = resolveBaseUrl(args.base);
  const cases = buildCases(stamp);

  console.log(`Base URL: ${base}`);
  if (args.dryRun) console.log('Mode: dry-run (no requests sent)\n');

  let failed = 0;

  for (const testCase of cases) {
    const url = `${base}${testCase.path}`;

    if (args.dryRun) {
      console.log(`[dry-run] ${testCase.name} POST ${url}`);
      console.log(JSON.stringify(testCase.body, null, 2));
      console.log('');
      continue;
    }

    process.stdout.write(`${testCase.name} ... `);

    try {
      const result = await postJson(url, testCase.body);
      const ok = testCase.okStatuses.includes(result.status);
      const label = ok ? 'OK' : 'FAIL';
      console.log(`${label} (${result.status})`);

      if (result.data && result.data.error) {
        console.log(`  error: ${result.data.error}`);
      }
      if (result.status === 502 && result.data && result.data.emailError) {
        console.log(`  note: saved to Supabase; email failed (${result.data.emailError})`);
      }
      if (!ok) {
        failed += 1;
        if (result.data && result.data.detail) {
          console.log(`  detail: ${String(result.data.detail).slice(0, 240)}`);
        }
      }
    } catch (error) {
      failed += 1;
      console.log('FAIL (network)');
      console.log(`  ${error.message}`);
    }
  }

  if (args.dryRun) return;

  if (failed) {
    console.error(`\n${failed} check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAll API smoke checks passed.');
}

main().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
