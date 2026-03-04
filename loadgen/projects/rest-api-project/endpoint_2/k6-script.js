import { check, sleep } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { addIteration, getBaseUrl } from '../api-utils';

// CONFIG
const OPTIONS = JSON.parse(__ENV.OPTIONS || '["opt1", "opt2", "opt3", "opt4"]');
const ITERATIONS = Number(__ENV.ITERATIONS || 5);
const MAX_TPS = Number(__ENV.MAX_TPS || 10000);

// Spike load scenario: quick ramp-up, short hold, then ramp-down
export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 1000,        // start with 1k TPS baseline
      timeUnit: '1s',
      preAllocatedVUs: 2000,  // initial pool of VUs
      maxVUs: 10000,
      stages: [
        { target: MAX_TPS, duration: '2m' },  // spike up to 10k TPS
        { target: MAX_TPS, duration: '1m' },  // hold at 10k TPS
        { target: 1000, duration: '1m' },     // ramp back down to 1k TPS
        { target: 0, duration: '30s' },       // graceful stop
      ],
    },
  },
};

export function issueToken(body) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/issue-token`;
  return postRequest(url, body);
}

export default function () {
  // Step 1: Issue token
  const tokenBody = {}
  const tokenRes = issueToken(tokenBody);

  if (!tokenRes?.data?.accessToken) {
    console.error('Failed to get token');
    return;
  }

  const token = tokenRes?.data?.accessToken;

  // Step 2: Iterate N times with random options
  for (let i = 0; i < ITERATIONS; i++) {
    const optionId = randomItem(OPTIONS);
    const iterationBody = { 'iterationCount': 1 };
    const iteration = addIteration(iterationBody, optionId, token);
    console.log(iteration)

    check(iteration, {
      [`iteration ${i + 1} success`]: (r) => r?.success === true && r?.data?.success === true,
    });

    sleep(0.1); // small delay between iterations
  }
}
