// api.js
const API_BASE_URL = "http://localhost:3000";

async function apiRequest(endpoint, method = "POST", body = null) {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Error ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

export async function analyzeScheduling(quantum, processes) {
    const payload = {
        quantum: Number(quantum),
        processes: processes.map(p => ({
            pid: p.name,
            at: Number(p.arrival),
            bt: Number(p.burst)
        }))
    };

    return await apiRequest("/api/analyze", "POST", payload);
}