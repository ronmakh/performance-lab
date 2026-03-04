import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Resolve TEST_ID from environment or default
const testID = __ENV.TEST_ID || 'site-a';

// Select JSON file based on TEST_ID
const urlsFile = './urls.json'

// Load URLs once per test run from the selected file
const urls = new SharedArray('sitemap urls', function () {
  return JSON.parse(open(urlsFile));
});

// Custom counters for status codes
const responseCounters = {
  200: new Counter('http_responses_200'),
  301: new Counter('http_responses_301'),
  302: new Counter('http_responses_302'),
  400: new Counter('http_responses_400'),
  401: new Counter('http_responses_401'),
  403: new Counter('http_responses_403'),
  404: new Counter('http_responses_404'),
  500: new Counter('http_responses_500'),
  502: new Counter('http_responses_502'),
  503: new Counter('http_responses_503'),
  other: new Counter('http_responses_other'),
};

const errors = new Counter('errors');
const urlHits = new Counter('url_hits');

export const options = {
  tags: {
    testid: testID,
  },
  scenarios: {
    content_traffic: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 1,
      maxVUs: 1,
      stages: [{ target: 2, duration: '5m' }],
    },
  },
  thresholds: {
    http_req_duration: ['p(90)<1500'],
    http_req_failed: ['rate<0.005'],
    errors: ['count<50'],
  },
};

export default function () {
  const url = urls[Math.floor(Math.random() * urls.length)];

  const res = http.get(url, { tags: { testid: testID } });

  if (responseCounters[res.status]) {
    responseCounters[res.status].add(1, { testid: testID });
  } else {
    responseCounters.other.add(1, { testid: testID });
  }

  if (res.status < 200 || res.status >= 300) {
    errors.add(1, { testid: testID, status: res.status });
  }

  urlHits.add(1, { url });

  check(res, { 'status is 2xx': (r) => r.status >= 200 && r.status < 300 });

  sleep(Math.random() * 5 + 2);
}