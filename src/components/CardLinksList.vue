<template>
    <div class="section">
        <h4>Links</h4>
        <div v-for="link in card.links" :key="link.id" class="link-row">
            <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>
            <button v-if="!readOnly" type="button" class="remove-btn" @click="$emit('remove', link.id)">&times;</button>
        </div>
        <form v-if="!readOnly" class="add-row" @submit.prevent="submit">
            <input v-model="label" type="text" placeholder="Label">
            <input v-model="url" type="url" placeholder="https://...">
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
    emits: ["add", "remove"],
    setup(props, { emit }) {
        let label = ref("");
        let url = ref("");
        let submit = () => {
            if (!label.value.trim() || !url.value.trim()) return;
            emit("add", label.value.trim(), url.value.trim());
            label.value = "";
            url.value = "";
        };
        return { label, url, submit };
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

.link-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 14px;
}

.link-row a {
    flex: 1;
    color: var(--color-primary);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.link-row a:hover {
    text-decoration: underline;
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
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: inherit;
}

.add-row input:first-of-type {
    flex: 0 0 35%;
}

.add-row input:nth-of-type(2) {
    flex: 1;
}

.add-row input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}
</style>
