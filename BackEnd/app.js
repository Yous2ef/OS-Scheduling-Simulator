import { createServer } from "http";
import { json } from "stream/consumers";
import { execFileSync } from "child_process";
import { log } from "console";

const PORT = 3000;
const enginePath = "../C/scheduler_engine";

const parseJsonBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => {
            if (!body) {
                return resolve({});
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error("Invalid JSON payload"));
            }
        });

        req.on("error", reject);
    });
};

const isValidProcess = (proc) => {
    return (
        proc &&
        typeof proc === "object" &&
        typeof proc.pid === "string" &&
        typeof proc.at === "number" &&
        Number.isFinite(proc.at) &&
        typeof proc.bt === "number" &&
        Number.isFinite(proc.bt)
    );
};

const validatePayload = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return false;
    }

    if (typeof data.quantum !== "number" || !Number.isFinite(data.quantum)) {
        return false;
    }

    if (!Array.isArray(data.processes) || data.processes.length === 0) {
        return false;
    }

    return data.processes.every(isValidProcess);
};

const sendJson = (res, statusCode, payload) => {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
};

const convertToString = (data) => {
    let stringifiedData = "";

    stringifiedData += `${data.quantum}\n`;

    for (let i = 0; i < data.processes.length; i++) {
        const proc = data.processes[i];
        stringifiedData += ` ${proc.pid} ${proc.at} ${proc.bt}\n`;
    }

    return stringifiedData;
};

const startAnalysis = (data) => {
    const stringifiedData = convertToString(data);
    // console.log("Stringified data for analysis:\n", stringifiedData);
    try {
        const output = execFileSync(enginePath, [stringifiedData], {
            encoding: "utf-8",
        });
        // console.log(output);

        return JSON.parse(output);
    } catch (err) {
        console.error("Error executing main.exe:", err);
        throw new Error("Failed to process data with main.exe");
    }
};

const handleRequest = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }
    if (req.url === "/api/analyze" && req.method === "POST") {
        try {
            const data = await parseJsonBody(req);

            if (!validatePayload(data)) {
                // console.log("Invalid payload received:", data);
                return sendJson(res, 400, {
                    error: "Invalid payload",
                    expected: {
                        quantum: "number",
                        processes: [
                            { pid: "string", at: "number", bt: "number" },
                        ],
                    },
                });
            }

            // console.log("Valid payload:", data);

            const analysisResult = startAnalysis(data);

            return sendJson(res, 200, {
                success: true,
                data: analysisResult,
            });
        } catch (error) {
            return sendJson(res, 400, {
                error: error.message || "Unable to parse request body",
            });
        }
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end(`${req.method} ${req.url} NOT FOUND`);
};

const SERVER = createServer(handleRequest);

SERVER.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});
