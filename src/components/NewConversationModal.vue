<template>
    <div class="form-backdrop" @click.self="$emit('cancel')">
        <div class="new-conversation-form">
            <h3>New conversation</h3>

            <div class="mode-row">
                <label :class="{ active: !isGroup }">
                    <input type="radio" :value="false" v-model="isGroup">
                    Direct message
                </label>
                <label :class="{ active: isGroup }">
                    <input type="radio" :value="true" v-model="isGroup">
                    Group
                </label>
            </div>

            <input v-if="isGroup" v-model="groupName" type="text" placeholder="Group name" maxlength="60">

            <input v-model="query" type="text" placeholder="Search by name or email..." @input="onQueryInput">

            <div v-if="selected.length" class="selected-chips">
                <span v-for="user in selected" :key="user.id" class="chip">
                    {{ user.displayName }}
                    <button type="button" @click="removeSelected(user.id)">&times;</button>
                </span>
            </div>

            <div v-if="results.length" class="results-list">
                <div v-for="user in results" :key="user.id" class="result-row" @click="selectUser(user)">
                    <div class="result-avatar">{{ initialsFor(user.displayName) }}</div>
                    <div class="result-info">
                        <p class="result-name">{{ user.displayName }}</p>
                        <p class="result-email">{{ user.email }}</p>
                    </div>
                </div>
            </div>

            <p v-if="error" class="error">{{ error }}</p>

            <div class="form-actions">
                <button type="button" class="cancel-btn" @click="$emit('cancel')">Cancel</button>
                <button type="button" :disabled="!canSubmit" @click="submit">Start</button>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, ref } from "vue";
import api from "@/api/config";

export default {
    props: {
        error: { type: String, default: "" },
    },
    emits: ["submit", "cancel"],
    setup(props, { emit }) {
        let isGroup = ref(false);
        let groupName = ref("");
        let query = ref("");
        let results = ref([]);
        let selected = ref([]);
        let searchTimer = null;

        let initialsFor = (name) => {
            if (!name) return "?";
            return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        };

        let onQueryInput = () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(async () => {
                let q = query.value.trim();
                if (!q) {
                    results.value = [];
                    return;
                }
                try {
                    let res = await api.get("/api/users/search", { params: { q } });
                    let selectedIds = selected.value.map((u) => u.id);
                    results.value = res.data.filter((u) => !selectedIds.includes(u.id));
                } catch (err) {
                    results.value = [];
                }
            }, 300);
        };

        let selectUser = (user) => {
            if (!isGroup.value) {
                selected.value = [user];
            } else if (!selected.value.some((u) => u.id === user.id)) {
                selected.value.push(user);
            }
            query.value = "";
            results.value = [];
        };

        let removeSelected = (userId) => {
            selected.value = selected.value.filter((u) => u.id !== userId);
        };

        let canSubmit = computed(() => {
            if (isGroup.value) {
                return groupName.value.trim().length > 0 && selected.value.length >= 2;
            }
            return selected.value.length === 1;
        });

        let submit = () => {
            if (!canSubmit.value) return;
            emit("submit", {
                type: isGroup.value ? "group" : "direct",
                name: isGroup.value ? groupName.value.trim() : undefined,
                participantIds: selected.value.map((u) => u.id),
            });
        };

        return {
            isGroup, groupName, query, results, selected, error: props.error,
            onQueryInput, selectUser, removeSelected, canSubmit, submit, initialsFor,
        };
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

.new-conversation-form {
    background: #ffffff;
    border-radius: var(--radius);
    padding: 24px;
    width: 90%;
    max-width: 420px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
}

.new-conversation-form h3 {
    margin: 0 0 16px;
}

.mode-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.mode-row label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 12px;
    color: var(--color-text-muted);
    cursor: pointer;
}

.mode-row label.active {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
}

.mode-row input {
    width: auto;
    margin: 0;
}

.new-conversation-form input[type="text"] {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: inherit;
    margin-bottom: 10px;
}

.new-conversation-form input[type="text"]:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
}

.chip button {
    background: transparent;
    box-shadow: none;
    color: var(--color-primary-dark);
    padding: 0;
    font-size: 13px;
}

.chip button:hover {
    transform: none;
    background: transparent;
}

.results-list {
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    margin-bottom: 10px;
}

.result-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    cursor: pointer;
}

.result-row:hover {
    background: var(--color-primary-light);
}

.result-avatar {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--color-primary);
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
}

.result-email {
    margin: 0;
    font-size: 11px;
    color: var(--color-text-muted);
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
