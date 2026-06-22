<template>
    <div class="form-backdrop" @click.self="$emit('cancel')">
        <form class="project-form" @submit.prevent="submit">
            <h3>New Project</h3>
            <input v-model="name" type="text" placeholder="Project name" maxlength="100" required>
            <textarea v-model="description" placeholder="What is this project about? (optional)"></textarea>
            <div class="visibility-row">
                <label :class="{ active: visibility === 'private' }">
                    <input type="radio" value="private" v-model="visibility">
                    Private — only invited members
                </label>
                <label :class="{ active: visibility === 'public' }">
                    <input type="radio" value="public" v-model="visibility">
                    Public — anyone can view and join
                </label>
            </div>
            <p v-if="error" class="error">{{ error }}</p>
            <div class="form-actions">
                <button type="button" class="cancel-btn" @click="$emit('cancel')">Cancel</button>
                <button type="submit">Create</button>
            </div>
        </form>
    </div>
</template>

<script>
import { ref } from "vue";

export default {
    props: {
        error: { type: String, default: "" },
    },
    emits: ["submit", "cancel"],
    setup(props, { emit }) {
        let name = ref("");
        let description = ref("");
        let visibility = ref("private");

        let submit = () => {
            if (!name.value.trim()) return;
            emit("submit", { name: name.value.trim(), description: description.value.trim(), visibility: visibility.value });
        };

        return { name, description, visibility, submit };
    },
};
</script>

<style scoped>
.form-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.project-form {
    background: #ffffff;
    border-radius: var(--radius);
    padding: 24px;
    width: 90%;
    max-width: 420px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
}

.project-form h3 {
    margin: 0 0 16px;
}

.project-form input,
.project-form textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 14px;
    font-family: inherit;
    margin-bottom: 12px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.project-form textarea {
    resize: vertical;
    min-height: 80px;
}

.project-form input:focus,
.project-form textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.visibility-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.visibility-row label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 13px;
    color: var(--color-text-muted);
    cursor: pointer;
}

.visibility-row label.active {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
}

.visibility-row input {
    width: auto;
    margin: 0;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cancel-btn {
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    box-shadow: none;
}

.cancel-btn:hover {
    background: var(--color-bg);
    color: var(--color-text);
    transform: none;
}
</style>
