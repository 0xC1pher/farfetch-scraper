/* eslint-disable */
/**
 * Network Capture Helper
 *
 * This script helps replay network requests with the original cookies and headers.
 */

// Prevent duplicate initialization
if (window.__NETWORK_CAPTURE_HELPER_INITIALIZED__) {
  // Already initialized, skip
} else {
  window.__NETWORK_CAPTURE_HELPER_INITIALIZED__ = true;

  /**
   * Replay a network request
   * @param {string} url - The URL to send the request to
   * @param {string} method - The HTTP method to use
   * @param {Object} headers - The headers to include in the request
   * @param {any} body - The body of the request
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<Object>} - The response data
   */
  async function replayNetworkRequest(url, method, headers, body, timeout = 30000) {
    try {
      // Create fetch options
      const options = {
        method: method,
        headers: headers || {},
        credentials: 'include', // Include cookies
        mode: 'cors',
        cache: 'no-cache',
      };

      // Add body for non-GET requests
      if (method !== 'GET' && method !== 'HEAD' && body !== undefined) {
        options.body = body;
      }

      // 创建一个带超时的 fetch
      const fetchWithTimeout = async (url, options, timeout) => {
        const controller = new AbortController();
        const signal = controller.signal;

        // 设置超时
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, { ...options, signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // 发送带超时的请求
      const response = await fetchWithTimeout(url, options, timeout);

      // Process response
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: {},
      };

      // Get response headers
      response.headers.forEach((value, key) => {
        responseData.headers[key] = value;
      });

      // Try to get response body based on content type
      const contentType = response.headers.get('content-type') || '';

      try {
        if (contentType.includes('application/json')) {
          responseData.body = await response.json();
        } else if (
          contentType.includes('text/') ||
          contentType.includes('application/xml') ||
          contentType.includes('application/javascript')
        ) {
          responseData.body = await response.text();
        } else {
          // For binary data, just indicate it was received but not parsed
          responseData.body = '[Binary data not displayed]';
        }
      } catch (error) {
        responseData.body = `[Error parsing response body: ${error.message}]`;
      }

      return {
        success: true,
        response: responseData,
      };
    } catch (error) {
      console.error('Error replaying request:', error);
      return {
        success: false,
        error: `Error replaying request: ${error.message}`,
      };
    }
  }

  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // Respond to ping message
    if (request.action === 'chrome_network_request_ping') {
      sendResponse({ status: 'pong' });
      return false; // Synchronous response
    } else if (request.action === 'sendPureNetworkRequest') {
      replayNetworkRequest(
        request.url,
        request.method,
        request.headers,
        request.body,
        request.timeout,
      )
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: `Unexpected error: ${error.message}`,
          });
        });
      return true; // Indicates async response
    }
  });
}
