import type {
    ListQueueQuerySchemaInput,
    QueueClinicIdParamsSchemaInput,
    QueueStatusUpdateParamsSchemaInput,
    ReorderQueueBodySchemaInput,
    UpdateQueueStatusBodySchemaInput,
} from './queue.validation.js';

export type QueueClinicIdParamsInput = QueueClinicIdParamsSchemaInput;

export type QueueStatusUpdateParamsInput = QueueStatusUpdateParamsSchemaInput;

export type ListQueueQueryInput = ListQueueQuerySchemaInput;

export type UpdateQueueStatusBodyInput = UpdateQueueStatusBodySchemaInput;

export type ReorderQueueBodyInput = ReorderQueueBodySchemaInput;
