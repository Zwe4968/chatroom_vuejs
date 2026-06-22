<template>
    <div class="section">
        <h4>Tasks</h4>
        <div v-for="task in card.tasks" :key="task.id" class="task-row">
            <input type="checkbox" :checked="task.done" :disabled="readOnly" @change="$emit('toggle', task.id, $event.target.checked)">
            <span :class="{ done: task.done }">{{ task.text }}</span>
            <button v-if="!readOnly" type="button" class="remove-btn" @click="$emit('remove', task.id)">&times;</button>
        </div>
        <form v-if="!readOnly" class="add-row" @submit.prevent="submit">
            <input v-model="text" type="text" placeholder="Add a task...">
            <button type="submit">Add</button>
        </form>
    </div>
</template>

<script>
import { ref } from "vue";

export default {
    props: {
        card: { type: Object, required: true },
        readOnly: { type: Boolean, default: false },
    },
    emits: ["add", "toggle", "remove"],
    setup(props, { emit }) {
        let text = ref("");
        let submit = () => {
            if (!text.value.trim()) return;
            emit("add", text.value.trim());
            text.value = "";
        };
        return { text, submit };
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

.task-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 14px;
}

.task-row span {
    flex: 1;
}

.task-row span.done {
    text-decoration: line-through;
    color: var(--color-text-muted);
}

.remove-btn {
    background: transparent;
    color: var(--color-text-muted);
    box-shadow: none;
    padding: 0 6px;
    font-size: 16px;
}

.remove-btn:hover {
    color: var(--color-danger);
    background: transparent;
    transform: none;
}

.add-row {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.add-row input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: inherit;
}

.add-row input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}
</style>
