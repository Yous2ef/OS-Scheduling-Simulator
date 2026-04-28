#include <stdio.h>
#include <string.h>
#include "scheduler.h"

// Printing results in JSON format for both RR and SRTF
void printInJsonForm(SimulationResult rrResult, SimulationResult srtfResult, Process rrProcesses[], Process srtfProcesses[], int numOfProcesses) {
    printf("{\n");

    //RR
    printf("  \"rr\": {\n");
    
    //RR Gantt Chart
    printf("    \"gantt\": [\n");
    for (int i = 0; i < rrResult.gantt_count; i++) {
        int arrival = 0;
        for (int j = 0; j < numOfProcesses; j++) {
            if (strcmp(rrProcesses[j].process_id, rrResult.gantt[i].process_id) == 0) {
                arrival = rrProcesses[j].arrival_time;
                break;
            }
        }
        printf("      {\"pid\": \"%s\", \"arrival\": %d, \"start\": %d, \"end\": %d}%s\n",
               rrResult.gantt[i].process_id, arrival, rrResult.gantt[i].start_time, 
               rrResult.gantt[i].end_time, (i == rrResult.gantt_count - 1) ? "" : ",");
    }
    printf("    ],\n");

    // RR Metrics
    printf("    \"metrics\": {\n");
    printf("      \"avg_wt\": %.2f, \"avg_tat\": %.2f, \"avg_rt\": %.2f\n", 
           rrResult.avg_wt, rrResult.avg_tat, rrResult.avg_rt);
    printf("    },\n");

    //Processes data
    printf("    \"processes\": [\n");
    for (int i = 0; i < numOfProcesses; i++) {
        printf("      {\"pid\": \"%s\", \"arrival\": %d, \"burst\": %d, \"wt\": %d, \"tat\": %d, \"rt\": %d}%s\n",
               rrProcesses[i].process_id, rrProcesses[i].arrival_time, rrProcesses[i].burst_time, 
               rrProcesses[i].waiting_time, rrProcesses[i].turnaround_time, rrProcesses[i].response_time,
               (i == numOfProcesses - 1) ? "" : ",");
    }
    printf("    ]\n  },\n");

    //SRTF
    printf("  \"srtf\": {\n");
    
    //SRTF Gantt Chart
    printf("    \"gantt\": [\n");
    for (int i = 0; i < srtfResult.gantt_count; i++) {
        int arrival = 0;
        for (int j = 0; j < numOfProcesses; j++) {
            if (strcmp(srtfProcesses[j].process_id, srtfResult.gantt[i].process_id) == 0) {
                arrival = srtfProcesses[j].arrival_time;
                break;
            }
        }
        printf("      {\"pid\": \"%s\", \"arrival\": %d, \"start\": %d, \"end\": %d}%s\n",
               srtfResult.gantt[i].process_id, arrival, srtfResult.gantt[i].start_time, 
               srtfResult.gantt[i].end_time, (i == srtfResult.gantt_count - 1) ? "" : ",");
    }
    printf("    ],\n");

    // SRTF Metrics
    printf("    \"metrics\": {\n");
    printf("      \"avg_wt\": %.2f, \"avg_tat\": %.2f, \"avg_rt\": %.2f\n", 
           srtfResult.avg_wt, srtfResult.avg_tat, srtfResult.avg_rt);
    printf("    },\n");

    //processes data
    printf("    \"processes\": [\n");
    for (int i = 0; i < numOfProcesses; i++) {
        printf("      {\"pid\": \"%s\", \"arrival\": %d, \"burst\": %d, \"wt\": %d, \"tat\": %d, \"rt\": %d}%s\n",
               srtfProcesses[i].process_id, srtfProcesses[i].arrival_time, srtfProcesses[i].burst_time, 
               srtfProcesses[i].waiting_time, srtfProcesses[i].turnaround_time, srtfProcesses[i].response_time,
               (i == numOfProcesses - 1) ? "" : ",");
    }
    printf("    ]\n  }\n");

    printf("}\n");
}

// Check if the input data is recieved or not
int inputsReceived (int argc) {
    if (argc < 2) {
        printf("{\"error\": \"data did not received\"}\n");
        return 0;
    }
    return 1;
}

// Read quantum and processes data from the string data and store them in the respective arrays for RR and SRTF and check recieving the quantum
int readQuantumAndProcesses (char *data, Process rrProcesses[], Process srtfProcesses[], int *numOfProcesses, int *quantum , int *readBytes ) {
    if (sscanf(data, "%d %n", quantum, readBytes) != 1) {
        printf("{\"error\": \"Quantum did not received\"}\n");
        return 1;
    }
    data += *readBytes;

    while (*numOfProcesses < MAX_PROCESSES && 
           sscanf(data, " %s %d %d %n", 
                  rrProcesses[*numOfProcesses].process_id, 
                  &rrProcesses[*numOfProcesses].arrival_time, 
                  &rrProcesses[*numOfProcesses].burst_time, 
                  readBytes) == 3) {
        
        srtfProcesses[*numOfProcesses] = rrProcesses[*numOfProcesses];
        (*numOfProcesses)++;
        data += *readBytes;
    }
    return 0;
}

// Check for duplicated PIDs
int duplicatedProcessesIDs (Process rrProcesses[], int numOfProcesses) {
    for (int i = 0; i < numOfProcesses; i++) {
        for (int j = i + 1; j < numOfProcesses; j++) {
            if (strcmp(rrProcesses[i].process_id, rrProcesses[j].process_id) == 0) {
                printf("{\"error\": \"duplicate process ID detected: %s\"}\n", rrProcesses[i].process_id);
                return 1;
            }
        }
    }
    return 0;
}

// check if the processes recieved or not
int processesReceived(int numOfProcesses) {
    if (numOfProcesses == 0) {
        printf("{\"error\": \"processes did not received\"}\n");
        return 1;
    }
    return 0;
}

int main(int argc, char *argv[]) {

    Process rrProcesses[MAX_PROCESSES];
    Process srtfProcesses[MAX_PROCESSES];
    int numOfProcesses = 0;
    int quantum;
    char *data = argv[1];
    int readBytes = 0;
    
    if (!inputsReceived(argc)) {
        return 1;
    }

    if (readQuantumAndProcesses ( data , rrProcesses , srtfProcesses , &numOfProcesses , &quantum , &readBytes )) {
        return 1;
    }

    if (duplicatedProcessesIDs ( rrProcesses , numOfProcesses )) {
        return 1;
    }

    if (processesReceived(numOfProcesses)) {
        return 1;
    }

    SimulationResult rrResult = run_rr(rrProcesses, numOfProcesses, quantum) ;
    SimulationResult srtfResult = run_srtf(srtfProcesses, numOfProcesses) ;

    printInJsonForm(rrResult, srtfResult, rrProcesses, srtfProcesses, numOfProcesses);

    return 0;
}
