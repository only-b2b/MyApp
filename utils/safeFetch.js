// utils/safeFetch.js
export const safeFetchJSON = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`Non-JSON response from ${url}`);
      return { success: false, data: null, error: "Invalid response format" };
    }

    // Check status
    if (!response.ok) {
      return { 
        success: false, 
        data: null, 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, data, error: null };
    
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error.message);
    return { success: false, data: null, error: error.message };
  }
};