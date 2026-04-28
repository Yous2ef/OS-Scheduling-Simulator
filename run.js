const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const rootDir = __dirname;
const frontDir = path.join(rootDir, "FrontEnd");
const backDir = path.join(rootDir, "BackEnd");
const frontPort = Number(process.env.FRONT_PORT || 5500);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function assertExists(targetPath, label) {
    if (!fs.existsSync(targetPath)) {
        throw new Error(`${label} was not found: ${targetPath}`);
    }
}

function getContentType(filePath) {
    switch (path.extname(filePath).toLowerCase()) {
        case ".html":
            return "text/html; charset=utf-8";
        case ".css":
            return "text/css; charset=utf-8";
        case ".js":
            return "application/javascript; charset=utf-8";
        case ".json":
            return "application/json; charset=utf-8";
        case ".svg":
            return "image/svg+xml";
        case ".png":
            return "image/png";
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".ico":
            return "image/x-icon";
        case ".woff":
            return "font/woff";
        case ".woff2":
            return "font/woff2";
        default:
            return "application/octet-stream";
    }
}

function sendError(res, statusCode, message) {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(message);
}

function startFrontServer() {
    const server = http.createServer((req, res) => {
        const requestUrl = new URL(req.url, "http://localhost");
        const relativePath = decodeURIComponent(requestUrl.pathname).replace(
            /^\/+/,
            "",
        );
        const resolvedPath = path.resolve(
            frontDir,
            relativePath || "index.html",
        );
        const relativeToFront = path.relative(frontDir, resolvedPath);

        if (
            relativeToFront.startsWith("..") ||
            path.isAbsolute(relativeToFront)
        ) {
            sendError(res, 403, "Forbidden");
            return;
        }

        const filePath = fs.existsSync(resolvedPath)
            ? resolvedPath
            : relativePath === ""
              ? path.join(frontDir, "index.html")
              : null;

        if (!filePath) {
            sendError(res, 404, "File not found");
            return;
        }

        fs.readFile(filePath, (error, data) => {
            if (error) {
                sendError(res, 404, "File not found");
                return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", getContentType(filePath));
            res.end(data);
        });
    });

    server.listen(frontPort, () => {
        console.log(`Front-end is running on http://localhost:${frontPort}`);
    });

    return server;
}

function installBackendDependencies() {
    const nodeModulesPath = path.join(backDir, "node_modules");

    if (fs.existsSync(nodeModulesPath)) {
        console.log("Backend dependencies already installed.");
        return;
    }

    console.log("Installing backend dependencies...");
    const result = spawnSync(npmCommand, ["install"], {
        cwd: backDir,
        stdio: "inherit",
        shell: process.platform === "win32",
    });

    if (result.status !== 0) {
        throw new Error("npm install failed in BackEnd.");
    }
}

function startBackendServer() {
    const child = spawn(npmCommand, ["run", "server"], {
        cwd: backDir,
        stdio: "inherit",
        shell: process.platform === "win32",
    });

    child.on("exit", (code, signal) => {
        if (code === 0 || signal) {
            return;
        }

        console.error(`Backend exited with code ${code}.`);
        process.exit(code || 1);
    });

    return child;
}

function printUsage() {
    console.log("Usage: node run.js [--dry-run]");
    console.log("- Starts the front-end static server on port 5500.");
    console.log("- Runs npm install in BackEnd when node_modules is missing.");
    console.log("- Starts the backend server with npm run server.");
}

function runDryCheck() {
    assertExists(frontDir, "FrontEnd folder");
    assertExists(backDir, "BackEnd folder");
    assertExists(path.join(frontDir, "index.html"), "FrontEnd/index.html");
    assertExists(path.join(backDir, "package.json"), "BackEnd/package.json");

    console.log("Dry run passed. The script can start both servers.");
}

function main() {
    const args = new Set(process.argv.slice(2));

    if (args.has("--help") || args.has("-h")) {
        printUsage();
        return;
    }

    if (args.has("--dry-run")) {
        runDryCheck();
        return;
    }

    assertExists(frontDir, "FrontEnd folder");
    assertExists(backDir, "BackEnd folder");
    assertExists(path.join(frontDir, "index.html"), "FrontEnd/index.html");
    assertExists(path.join(backDir, "package.json"), "BackEnd/package.json");

    const frontServer = startFrontServer();

    try {
        installBackendDependencies();
    } catch (error) {
        frontServer.close();
        throw error;
    }

    const backendServer = startBackendServer();

    const shutdown = () => {
        frontServer.close();
        backendServer.kill();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("exit", () => {
        frontServer.close();
    });

    console.log(`Backend is running on http://localhost:3000`);
}

main();
