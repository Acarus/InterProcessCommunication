module.exports = {
    HOST: '127.0.0.1',
    PORT: 8848,
    PARTITION_SIZE: 3,
    TASK_PROCESS_FREQUENCY: 100,
    client: {
        WORKER: 'worker',
        CUSTOMER: 'customer'
    },
    state: {
        FREE: 'free',
        BUSY: 'busy',
        IN_QUEUE: 'inQueue',
        PROCESSED: 'processed'
    },
    query: {
        REGISTER: 'register',
        SUBMIT: 'submit',
        TASK_PROCESSED: 'taskProcessed',
        RESULT_RESPONSE: 'resultResponse',
        NEW_TASK: 'newTask'
    },
    status: {
        OK: 'ok'
    }
};