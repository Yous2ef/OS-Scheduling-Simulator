#include "Doubly_sorted_linked_queue.h"
#include <stdlib.h>
#include <stdio.h>

void createDSList(DoublyList* dl){
    dl->head = NULL;
}

int isDSListEmpty(DoublyList l){
    return l.head == NULL;
}

int isDSListFull(DoublyList l){
    return 0;
}

void insertDSList(DoublyList* dl, int key, Data data){
    // create new node
    DoubleNode* p = (DoubleNode*)malloc(sizeof(DoubleNode));
    p->data = data;
    p->key = key;

    // if the list don't have any node
    if(dl->head == NULL){
        p->prev = NULL;
        p->next = NULL;
        dl->head = p;
    }

    // if have nodes
    else{
        /// traverse until the position
        DoubleNode* q = dl->head;
        /** here to avoid if the new node is the largest then the q will be NULL,
            if we didn't make the second expression after the AND operator
         */
        while(key > q->key && q->next != NULL){
            q = q->next;
        }

        /// Special case -> if the new node has the greatest key number -> the last node
        if(key > q->key && q->next==NULL){
            p->next = NULL;
            p->prev = q;
            q->next = p;
            return;
        }

        /// insert the new node
        // pointing to the next node
        p->next = q;
        // pointing to the previous node
        p->prev = q->prev;

        if(q->prev) // if not NULL -> if not on the front of the list
            // point the next of previous node to the new node
            q->prev->next = p;
        else
            // make the head point to the new node. Because it's the smallest key
            dl->head = p;

        // point the previous of next node to the new node
        q->prev = p;
    }
}

Data retrieveDSList(DoublyList* dl, int key){
    // check if empty list
    if(isDSListEmpty(*dl)){
        printf("Error: Empty List.");
        return '\0';
    }
    else{
        DoubleNode* p = dl->head;

        while(p){ // means if the node is not NULL
            if(p->key == key){
                Data item = p->data;

                /// remove the node
                // at front of the list
                if(p->prev == NULL){
                    dl->head = p->next;

                    if(p->next!=NULL) // if the list will not be empty
                        p->next->prev = NULL;

                    free(p);
                }
                else if(p->next == NULL){ // at the end of the list
                    p->prev->next = NULL;
                    free(p);
                }
                else{ // at middle of the list
                    p->prev->next = p->next;
                    p->next->prev = p->prev;
                    free(p);
                }

                return item;
            }
            p = p->next;
        }

        return '\0';
    }
}

void printDSList(DoublyList l){
    DoubleNode *p = l.head;
    printf("head -> ");
    while(p){
        printf("[%d / %c] -> ", p->key, p->data);
        p = p->next;
    }
    printf("NULL");
}