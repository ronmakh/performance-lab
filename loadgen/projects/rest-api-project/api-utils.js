export function postRequest(url, data, token = null) {
  try {
    console.log("POST Request URL:", url);
    console.log("POST Request Data:", JSON.stringify(data));
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = http.post(url, JSON.stringify(data), { headers });

    trackResponseStatuses(response);
    trackErrors(response);
    trackUrlHits(url, "POST");

    if (response.status < 200 || response.status >= 300) {
      console.error(
        `HTTP error! Status: ${response.status} - ${response.body}`
      );
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = JSON.parse(response.body);
    console.log("POST Response:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error making POST request:", error);
    throw error;
  }
}

export function getRequest(url, token = null) {
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = http.get(url, { headers });

  trackResponseStatuses(res);
  trackErrors(res);
  trackUrlHits(url, "GET");

  if (res.status < 200 || res.status >= 300) {
    console.error(`HTTP error! Status: ${res.status} - ${res.body}`);
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  try {
    return JSON.parse(res.body);
  } catch (err) {
    console.error("Failed to parse JSON response:", err);
    return res.body;
  }
}

export function getBaseUrl() {
  return __ENV.BASE_URL || BASE_URL;
}

export function addIteration(body, optionId, token) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/iteration/${optionId}`;
  return postRequest(url, body, token);
}