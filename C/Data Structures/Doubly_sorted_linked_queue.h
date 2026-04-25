#ifndef OS_SCHEDULING_SIMULATOR_DOUBLY_SORTED_LINKED_QUEUE_H
#define OS_SCHEDULING_SIMULATOR_DOUBLY_SORTED_LINKED_QUEUE_H

typedef char Data;

typedef struct nodeS {
    int key;
    Data data;
    struct nodeS *next;
    struct nodeS *prev;
}DoubleNode;

typedef struct{
    DoubleNode *head;
}DoublyList;

void createList(DoublyList* l);
int isDSListEmpty(DoublyList l);
int isDSListFull(DoublyList l);
void insertDSList(DoublyList* l, int key, Data data);
Data retrieveDSList(DoublyList* l, int key);
void printDSList(DoublyList l);

#endif //OS_SCHEDULING_SIMULATOR_DOUBLY_SORTED_LINKED_QUEUE_H
