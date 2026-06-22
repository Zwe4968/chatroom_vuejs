<template>
    <div class="section">
        <h4>Notes</h4>
        <div v-for="note in card.notes" :key="note.id" class="note-row">
            <div class="note-meta">
                <span class="note-author">{{ note.author && note.author.displayName ? note.author.displayName : "Someone" }}</span>
                <button v-if="!readOnly && note.author && note.author.id === currentUserid" type="button" class="remove-btn" @click="$emit('remove', note.id)">&times;</button>
            </div>
            <p class="note-text">{{ note.text }}</p>
        </div>
        <form v-if="!readOnly" class="add-row" @submit.prevent="submit">
            <textarea v-model="text" placeholder="Add a note..."></textarea>
            <button type="submit">Add</button>
        </form>
    </div>
</template>

<script>
import { ref } from "vue";
import { getUser } from "@/composable/Getuser";

export default {
    props: {
        card: { type: Object, required: true },
        readOnly: { type: Boolean, default: false },
    },
    emits: ["add", "remove"],
    setup(props, { emit }) {
        let text = ref("");
        let { user } = getUser();
        let currentUserid = user.value ? user.value.uid : null;
        let submit = () => {
            if (!text.value.trim()) return;
            emit("add", text.value.trim());
            text.value = "";
        };
        return { text, submit, currentUserid };
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

.note-row {
    padding: 10px 12px;
    background: var(--color-bg);
    border-radius: 10px;
    margin-bottom: 8px;
}

.note-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.note-author {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
}

.note-text {
    margin: 4px 0 0;
    font-size: 14px;
    white-space: pre-wrap;
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
    align-items: flex-end;
}

.add-row textarea {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    min-height: 40px;
}

.add-row textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}
</style>
