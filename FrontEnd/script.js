// ====================== Import API ======================
import { analyzeScheduling } from './api.js';

let processes = [];
let nextProcessNumber = 1;

const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];

function getColor(index) {
    return colors[index % colors.length];
}

function renderTable() {
    const tbody = document.getElementById("processes-tbody");
    tbody.innerHTML = "";

    if (processes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-12 text-center text-gray-400 text-lg">
                    No processes added yet.<br>
                    Click "ADD A NEW PROCESS" to start
                </td>
            </tr>
        `;
        return;
    }

    processes.forEach((p, index) => {
        const row = document.createElement("tr");
        row.className = "border-b hover:bg-gray-50 transition";
        row.innerHTML = `
            <td class="px-6 py-5 font-medium flex items-center gap-3">
                <div class="w-5 h-5 rounded-lg" style="background-color: ${getColor(index)}"></div>
                ${p.name}
            </td>
            <td class="px-6 py-5">${p.arrival}</td>
            <td class="px-6 py-5">${p.burst}</td>
            <td class="px-6 py-5 text-center">
                <button data-id="${p.id}" class="delete-btn text-red-500 hover:text-red-700 text-xl">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // ربط أزرار الحذف بعد ما اتعملوا
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProcess(Number(btn.dataset.id)));
    });
}

function deleteProcess(id) {
    processes = processes.filter(p => p.id !== id);
    renderTable();
    renderDemoGantt();
}

function addNewProcess() {
    const newName = `Process${nextProcessNumber}`;
    document.getElementById("modal-process-name").value = newName;
    document.getElementById("modal-arrival").value = 0;
    document.getElementById("modal-burst").value = 0;
    document.getElementById("add-modal").classList.remove("hidden");
    document.getElementById("modal-arrival").focus();
}

function closeModal() {
    document.getElementById("add-modal").classList.add("hidden");
}

function submitAddProcess() {
    const name = document.getElementById("modal-process-name").value;
    const arrival = parseInt(document.getElementById("modal-arrival").value);
    const burst = parseInt(document.getElementById("modal-burst").value);

    if (isNaN(arrival) || arrival < 0) {
        alert("⚠️ Arrival Time must be 0 or a positive number!");
        document.getElementById("modal-arrival").focus();
        return;
    }

    if (isNaN(burst) || burst <= 0) {
        alert("⚠️ CPU Burst must be a positive number (greater than 0)!");
        document.getElementById("modal-burst").focus();
        return;
    }

    processes.push({ id: Date.now(), name, arrival, burst });
    nextProcessNumber++;

    renderTable();
    renderDemoGantt();
    closeModal();
}

function renderDemoGantt() {
    const html = processes.length === 0
        ? `<div class="w-full h-full flex items-center justify-center text-gray-500 text-lg">Add processes to see demo</div>`
        : processes.map((p, i) => `
            <div class="process-bar" style="width: ${Math.max(50, p.burst * 5)}px; background-color: ${getColor(i)};">
                ${p.name}
            </div>`).join('');

    document.getElementById("gantt-rr").innerHTML = html;
    document.getElementById("gantt-srtf").innerHTML = html;
}

function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        if (btn.getAttribute('data-tab') !== tab) {
            btn.classList.add('text-gray-600');
        } else {
            btn.classList.remove('text-gray-600');
        }
    });

    document.getElementById('rr-section').classList.toggle('hidden', tab !== 'rr');
    document.getElementById('srtf-section').classList.toggle('hidden', tab !== 'srtf');
}

function renderGanttFromData(containerId, schedule) {
    const container = document.getElementById(containerId);
    if (!schedule || schedule.length === 0) {
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-500">No data</div>`;
        return;
    }

    const processNames = [...new Set(schedule.map(s => s.pid))];

    container.innerHTML = schedule.map(s => {
        const colorIndex = processNames.indexOf(s.pid);
        const width = Math.max(40, (s.end - s.start) * 10);
        return `
            <div class="process-bar" style="width: ${width}px; background-color: ${getColor(colorIndex)};" title="${s.pid}: ${s.start} → ${s.end}">
                ${s.pid}
            </div>`;
    }).join('');
}

function renderResultsTable(tbodyId, results) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";

    if (!results || results.length === 0) return;

    results.forEach(p => {
        const row = document.createElement("tr");
        row.className = "border-b hover:bg-gray-50";
        row.innerHTML = `
            <td class="py-4 px-6 text-center font-medium">${p.pid}</td>
            <td class="py-4 px-6 text-center">${p.at}</td>
            <td class="py-4 px-6 text-center">${p.bt}</td>
            <td class="py-4 px-6 text-center">${p.wt}</td>
            <td class="py-4 px-6 text-center">${p.tat}</td>
            <td class="py-4 px-6 text-center">${p.rt}</td>
        `;
        tbody.appendChild(row);
    });
}

// ====================== Run Simulation ======================
async function runSimulation() {
    if (processes.length === 0) {
        alert("⚠️ Please add at least one process!");
        return;
    }

    const quantumVal = parseInt(document.getElementById("time-quantum").value);
    if (isNaN(quantumVal) || quantumVal <= 0) {
        alert("⚠️ Time Quantum must be a positive number (greater than 0)!");
        document.getElementById("time-quantum").focus();
        return;
    }
    const quantum = quantumVal;

    // Loading State — FIX: use getElementById بدل querySelector على onclick
    const runBtn = document.getElementById("run-simulation-btn");
    const originalText = runBtn.innerHTML;
    runBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing...`;
    runBtn.disabled = true;

    try {
        const result = await analyzeScheduling(quantum, processes);
        console.log("✅ Result from backend:", result);

        const data = result.data;

        // عرض Gantt Charts
        if (data.rr?.schedule) renderGanttFromData("gantt-rr", data.rr.schedule);
        if (data.srtf?.schedule) renderGanttFromData("gantt-srtf", data.srtf.schedule);

        // عرض جداول النتائج
        if (data.rr?.processes) renderResultsTable("rr-table-body", data.rr.processes);
        if (data.srtf?.processes) renderResultsTable("srtf-table-body", data.srtf.processes);

        // عرض Summary
        if (data.rr?.averages) {
            document.getElementById("avg-waiting").textContent = data.rr.averages.wt?.toFixed(2) ?? "--";
            document.getElementById("avg-turnaround").textContent = data.rr.averages.tat?.toFixed(2) ?? "--";
            document.getElementById("avg-runtime").textContent = data.rr.averages.rt?.toFixed(2) ?? "--";
        }

    } catch (error) {
        console.error("Error:", error);
        alert("❌ Failed to connect to server:\n" + error.message);
    } finally {
        runBtn.innerHTML = originalText;
        runBtn.disabled = false;
    }
}

// ====================== Init ======================
document.addEventListener("DOMContentLoaded", () => {
    // ✅ 3 أمثلة افتراضية
    processes = [
        { id: Date.now() + 1, name: "Process1", arrival: 0, burst: 5 },
        { id: Date.now() + 2, name: "Process2", arrival: 2, burst: 3 },
        { id: Date.now() + 3, name: "Process3", arrival: 4, burst: 8 },
    ];
    nextProcessNumber = 4;
    renderTable();
    renderDemoGantt();
    switchTab('rr');

    // ✅ ربط كل الأزرار بـ Event Listeners
    document.getElementById("add-process-btn").addEventListener("click", addNewProcess);
    document.getElementById("run-simulation-btn").addEventListener("click", runSimulation);
    document.getElementById("modal-cancel-btn").addEventListener("click", closeModal);
    document.getElementById("modal-add-btn").addEventListener("click", submitAddProcess);

    // ✅ ربط Tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.getAttribute('data-tab')));
    });

    // ✅ إغلاق المودال لو الي ضغط برا
    document.getElementById("add-modal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("add-modal")) closeModal();
    });
});