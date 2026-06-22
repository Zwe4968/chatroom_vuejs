<template>
    <div class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-panel">
            <div class="modal-main">
                <div class="modal-header">
                    <input class="title-input" v-model="title" :disabled="readOnly" @blur="saveTitle" placeholder="Card title">
                    <button type="button" class="close-btn" @click="$emit('close')">&times;</button>
                </div>

                <p v-if="readOnly" class="read-only-note">You have read-only access to this card.</p>

                <div class="meta-row">
                    <label class="meta-field">
                        <span>Status</span>
                        <select v-model="status" :disabled="readOnly" @change="onStatusChange">
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                        </select>
                    </label>
                    <label class="meta-field">
                        <span>Priority</span>
                        <select v-model="priority" :disabled="readOnly" @change="onPriorityChange">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </label>
                    <label class="meta-field">
                        <span>Due date</span>
                        <input type="date" v-model="dueDate" :disabled="readOnly" @change="onDueDateChange">
                    </label>
                </div>

                <div class="project-badges">
                    <span class="project-badge">{{ project.name }}</span>
                    <span v-if="card.projectIds.length > 1" class="project-badge muted">+{{ card.projectIds.length - 1 }} more project{{ card.projectIds.length > 2 ? "s" : "" }}</span>
                </div>

                <div class="assignee-section">
                    <span class="assignee-label">Assignees</span>
                    <div class="assignee-chips">
                        <label v-for="member in project.members" :key="member.userId" class="assignee-chip" :class="{ active: isAssigned(member.userId) }">
                            <input type="checkbox" :checked="isAssigned(member.userId)" :disabled="readOnly" @change="toggleAssignee(member.userId)">
                            {{ member.displayName }}
                        </label>
                    </div>
                </div>

                <div class="section description-section">
                    <h4>Description</h4>
                    <textarea v-model="description" :disabled="readOnly" @blur="saveDescription" placeholder="Add a description..."></textarea>
                </div>

                <CardTasksList :card="card" :read-only="readOnly" @add="onAddTask" @toggle="onToggleTask" @remove="onRemoveTask"></CardTasksList>
                <CardLinksList :card="card" :read-only="readOnly" @add="onAddLink" @remove="onRemoveLink"></CardLinksList>
                <CardNotesList :card="card" :read-only="readOnly" @add="onAddNote" @remove="onRemoveNote"></CardNotesList>
                <CardAcknowledgements :card="card" :read-only="readOnly" @add="onAddAck" @remove="onRemoveAck"></CardAcknowledgements>
            </div>

            <div class="modal-chat">
                <h4 class="chat-title">Card Chat</h4>
                <CardChatWindow :messages="chat.messages.value"></CardChatWindow>
                <CardChatForm v-if="!readOnly" @send="chat.sendMessage"></CardChatForm>
            </div>
        </div>
    </div>
</template>

<script>
import { onMounted, onUnmounted, ref, watch } from "vue";
import CardTasksList from "@/components/CardTasksList.vue";
import CardLinksList from "@/components/CardLinksList.vue";
import CardNotesList from "@/components/CardNotesList.vue";
import CardAcknowledgements from "@/components/CardAcknowledgements.vue";
import CardChatWindow from "@/components/CardChatWindow.vue";
import CardChatForm from "@/components/CardChatForm.vue";
import { useCardChat } from "@/composable/UseCardChat";

export default {
    components: { CardTasksList, CardLinksList, CardNotesList, CardAcknowledgements, CardChatWindow, CardChatForm },
    props: {
        card: { type: Object, required: true },
        project: { type: Object, required: true },
        cardsStore: { type: Object, required: true },
        readOnly: { type: Boolean, default: false },
    },
    emits: ["close"],
    setup(props) {
        let title = ref(props.card.title);
        let description = ref(props.card.description);
        let status = ref(props.card.status);
        let priority = ref(props.card.priority);
        let dueDate = ref(props.card.dueDate ? props.card.dueDate.slice(0, 10) : "");

        watch(() => props.card.id, () => {
            title.value = props.card.title;
            description.value = props.card.description;
            status.value = props.card.status;
            priority.value = props.card.priority;
            dueDate.value = props.card.dueDate ? props.card.dueDate.slice(0, 10) : "";
        });

        let saveTitle = () => {
            if (title.value.trim() && title.value !== props.card.title) {
                props.cardsStore.updateCard(props.card.id, { title: title.value.trim() });
            }
        };

        let saveDescription = () => {
            if (description.value !== props.card.description) {
                props.cardsStore.updateCard(props.card.id, { description: description.value });
            }
        };

        let onStatusChange = () => {
            let targetColumnSize = props.cardsStore.cards.value.filter((c) => c.status === status.value && c.id !== props.card.id).length;
            props.cardsStore.reorderCard(props.card.id, status.value, targetColumnSize, props.project.id);
        };

        let onPriorityChange = () => {
            props.cardsStore.updateCard(props.card.id, { priority: priority.value });
        };

        let onDueDateChange = () => {
            props.cardsStore.updateCard(props.card.id, { dueDate: dueDate.value || null });
        };

        let isAssigned = (userId) => props.card.assignees.some((a) => a.id === userId);

        let toggleAssignee = (userId) => {
            let current = props.card.assignees.map((a) => a.id);
            let next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
            props.cardsStore.updateCard(props.card.id, { assignees: next });
        };

        let onAddTask = (text) => props.cardsStore.addTask(props.card.id, text);
        let onToggleTask = (taskId, done) => props.cardsStore.updateTask(props.card.id, taskId, { done });
        let onRemoveTask = (taskId) => props.cardsStore.removeTask(props.card.id, taskId);

        let onAddLink = (label, url) => props.cardsStore.addLink(props.card.id, label, url);
        let onRemoveLink = (linkId) => props.cardsStore.removeLink(props.card.id, linkId);

        let onAddNote = (text) => props.cardsStore.addNote(props.card.id, text);
        let onRemoveNote = (noteId) => props.cardsStore.removeNote(props.card.id, noteId);

        let onAddAck = (type) => props.cardsStore.addAcknowledgement(props.card.id, type);
        let onRemoveAck = (ackId) => props.cardsStore.removeAcknowledgement(props.card.id, ackId);

        let chat = useCardChat(props.card.id);
        onMounted(async () => {
            await chat.fetchHistory();
            chat.join();
        });
        onUnmounted(() => {
            chat.leave();
        });

        return {
            title, description, status, priority, dueDate,
            saveTitle, saveDescription, onStatusChange, onPriorityChange, onDueDateChange,
            isAssigned, toggleAssignee,
            onAddTask, onToggleTask, onRemoveTask,
            onAddLink, onRemoveLink,
            onAddNote, onRemoveNote,
            onAddAck, onRemoveAck,
            chat,
        };
    },
};
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 20px;
}

.modal-panel {
    background: #ffffff;
    border-radius: var(--radius);
    width: 100%;
    max-width: 920px;
    max-height: 90vh;
    display: flex;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.25);
}

.modal-main {
    flex: 1.4;
    padding: 24px;
    overflow-y: auto;
}

.modal-chat {
    flex: 1;
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
}

.chat-title {
    margin: 16px 0 0 16px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
}

.modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.title-input {
    flex: 1;
    font-size: 18px;
    font-weight: 700;
    border: none;
    padding: 6px 8px;
    border-radius: 8px;
}

.title-input:focus {
    outline: none;
    background: var(--color-bg);
}

.close-btn {
    background: transparent;
    color: var(--color-text-muted);
    box-shadow: none;
    font-size: 22px;
    line-height: 1;
    padding: 0 6px;
}

.close-btn:hover {
    color: var(--color-text);
    background: transparent;
    transform: none;
}

.read-only-note {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    padding: 8px 12px;
    border-radius: var(--radius);
    font-size: 12px;
    margin: 0 0 12px;
}

.meta-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.meta-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-muted);
}

.meta-field select,
.meta-field input {
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
}

.project-badges {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.project-badge {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 10px;
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    font-weight: 600;
}

.project-badge.muted {
    background: var(--color-border);
    color: var(--color-text-muted);
}

.assignee-section {
    margin-bottom: 16px;
}

.assignee-label {
    display: block;
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: 6px;
}

.assignee-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.assignee-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    cursor: pointer;
}

.assignee-chip.active {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary-dark);
}

.description-section textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
}

.description-section textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

@media (max-width: 720px) {
    .modal-backdrop {
        padding: 0;
    }

    .modal-panel {
        flex-direction: column;
        max-height: 100vh;
        height: 100vh;
        border-radius: 0;
        overflow-y: auto;
    }

    .modal-main {
        padding: 16px;
        flex: none;
    }

    .modal-chat {
        border-left: none;
        border-top: 1px solid var(--color-border);
        flex: none;
    }

    .meta-row {
        flex-direction: column;
        gap: 10px;
    }

    .meta-field select,
    .meta-field input {
        width: 100%;
    }

    .assignee-chips {
        gap: 6px;
    }
}
</style>
