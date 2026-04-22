#include "scheduler.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

SimulationResult run_rr(Process processes[], int num_processes, int quantum) {
    SimulationResult res;
    res.gantt_count = 0;
    res.avg_wt = 0;
    res.avg_tat = 0;
    res.avg_rt = 0;

    int current_time = 0;
    int completed_count = 0;

    int queue[MAX_PROCESSES * MAX_PROCESSES]; // large enough queue
    int front = 0, rear = 0;

    bool in_queue[MAX_PROCESSES] = {false};

    for (int i = 0; i < num_processes; i++) {
        processes[i].remaining_time = processes[i].burst_time;
        processes[i].first_start_time = -1;
    }

    while (completed_count < num_processes) {
        // Enqueue initially arrived processes at current_time
        for (int i = 0; i < num_processes; i++) {
            if (processes[i].arrival_time <= current_time && 
                processes[i].remaining_time > 0 && 
                !in_queue[i]) {
                queue[rear++] = i;
                in_queue[i] = true;
            }
        }

        if (front == rear) { // Queue is empty, jump to next arrival
            int next_arrival = -1;
            for (int i = 0; i < num_processes; i++) {
                if (processes[i].remaining_time > 0) {
                    if (next_arrival == -1 || processes[i].arrival_time < next_arrival) {
                        next_arrival = processes[i].arrival_time;
                    }
                }
            }
            if (next_arrival != -1) {
                current_time = next_arrival;
            }
            continue;
        }

        int idx = queue[front++];
        in_queue[idx] = false;

        if (processes[idx].first_start_time == -1) {
            processes[idx].first_start_time = current_time;
            processes[idx].response_time = current_time - processes[idx].arrival_time;
        }

        int exec_time = (processes[idx].remaining_time < quantum) ? processes[idx].remaining_time : quantum;
        
        // Formulate Gantt Segment
        strcpy(res.gantt[res.gantt_count].process_id, processes[idx].process_id);
        res.gantt[res.gantt_count].start_time = current_time;
        res.gantt[res.gantt_count].end_time = current_time + exec_time;
        res.gantt_count++;

        current_time += exec_time;
        processes[idx].remaining_time -= exec_time;

        // Add dynamically arriving processes into queue while this was executing
        for (int i = 0; i < num_processes; i++) {
            if (processes[i].arrival_time <= current_time && 
                processes[i].remaining_time > 0 && 
                !in_queue[i] && i != idx) { 
                queue[rear++] = i;
                in_queue[i] = true;
            }
        }

        if (processes[idx].remaining_time > 0) {
            queue[rear++] = idx;
            in_queue[idx] = true;
        } else {
            processes[idx].completion_time = current_time;
            processes[idx].turnaround_time = processes[idx].completion_time - processes[idx].arrival_time;
            processes[idx].waiting_time = processes[idx].turnaround_time - processes[idx].burst_time;
            completed_count++;
        }
    }

    double total_wt = 0, total_tat = 0, total_rt = 0;
    if (num_processes > 0) {
        for (int i = 0; i < num_processes; i++) {
            total_wt += processes[i].waiting_time;
            total_tat += processes[i].turnaround_time;
            total_rt += processes[i].response_time;
        }
        res.avg_wt = total_wt / num_processes;
        res.avg_tat = total_tat / num_processes;
        res.avg_rt = total_rt / num_processes;
    }

    return res;
}
