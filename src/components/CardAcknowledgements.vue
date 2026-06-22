<template>
    <div class="section">
        <h4>Acknowledgements</h4>
        <div v-if="!readOnly" class="ack-buttons">
            <button
                v-for="type in ackTypes"
                :key="type"
                type="button"
                :class="['ack-btn', { active: hasAcked(type) }]"
                @click="toggle(type)"
            >
                {{ labelFor(type) }}
            </button>
        </div>
        <div v-if="card.acknowledgements.length" class="ack-list">
            <div v-for="ack in card.acknowledgements" :key="ack.id" class="ack-row">
                <span class="ack-type">{{ labelFor(ack.type) }}</span>
                <span class="ack-user">{{ ack.user && ack.user.displayName ? ack.user.displayName : "Someone" }}</span>
            </div>
        </div>
        <p v-else class="empty-hint">No acknowledgements yet.</p>
    </div>
</template>

<script>
import { getUser } from "@/composable/Getuser";

const ACK_TYPES = ["approve", "confirm", "review", "completed"];
const LABELS = { approve: "Approve", confirm: "Confirm", review: "Review", completed: "Mark Completed" };

export default {
    props: {
        card: { type: Object, required: true },
        readOnly: { type: Boolean, default: false },
    },
    emits: ["add", "remove"],
    setup(props, { emit }) {
        let { user } = getUser();
        let currentUserid = user.value ? user.value.uid : null;

        let labelFor = (type) => LABELS[type] || type;

        let findOwnAck = (type) => {
            return props.card.acknowledgements.find((a) => a.type === type && a.user && a.user.id === currentUserid);
        };

        let hasAcked = (type) => !!findOwnAck(type);

        let toggle = (type) => {
            let existing = findOwnAck(type);
            if (existing) {
                emit("remove", existing.id);
            } else {
                emit("add", type);
            }
        };

        return { ackTypes: ACK_TYPES, labelFor, hasAcked, toggle };
    },
};
</script>

<style scoped>
.section {
    padding: 16px 0;
    border-top: 1px solid var(--color-border);
}

.section h4 {
    margin: 0 0 10px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
}

.ack-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.ack-btn {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    box-shadow: none;
    font-size: 12px;
    padding: 8px 14px;
}

.ack-btn:hover {
    background: var(--color-primary-light);
    transform: none;
}

.ack-btn.active {
    background: var(--color-primary);
    color: #ffffff;
}

.ack-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.ack-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 6px 10px;
    background: var(--color-bg);
    border-radius: 8px;
}

.ack-type {
    font-weight: 600;
    color: var(--color-text);
}

.ack-user {
    color: var(--color-text-muted);
}

.empty-hint {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
}
</style>
