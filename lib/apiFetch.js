// lib/apiFetch.js

export const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, options);

    // Guard against HTML error pages (e.g. from misconfigured routes)
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        throw new Error(
            `Server error (${response.status}). Unexpected response format — expected JSON.`
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
};