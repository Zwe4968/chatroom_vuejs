<template>
    <div
        class="card-tile"
        :class="{ 'not-draggable': !draggable }"
        :draggable="draggable"
        @dragstart="onDragStart"
        @click="$emit('open', card.id)"
    >
        <div class="priority-row">
            <span class="priority-badge" :class="'priority-' + card.priority">{{ card.priority }}</span>
            <span v-if="card.projectIds.length > 1" class="multi-project-badge" title="Linked to multiple projects">{{ card.projectIds.length }} projects</span>
        </div>
        <p class="card-title">{{ card.title }}</p>
        <div class="card-meta">
            <span v-if="card.dueDate" class="due-date" :class="{ overdue: isOverdue }">{{ formattedDueDate }}</span>
            <span v-if="card.tasks.length" class="task-progress">{{ doneTaskCount }}/{{ card.tasks.length }} tasks</span>
        </div>
        <div v-if="card.assignees.length" class="assignee-avatars">
            <div v-for="a in card.assignees" :key="a.id" class="assignee-avatar" :title="a.displayName">
                {{ initialsFor(a.displayName) }}
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from "vue";
import { format, isPast } from "date-fns";

export default {
    props: {
        card: { type: Object, required: true },
        draggable: { type: Boolean, default: true },
    },
    emits: ["open", "dragstart"],
    setup(props, { emit }) {
        let formattedDueDate = computed(() => {
            return props.card.dueDate ? format(new Date(props.card.dueDate), "MMM d") : "";
        });

        let isOverdue = computed(() => {
            return props.card.dueDate ? isPast(new Date(props.card.dueDate)) && props.card.status !== "completed" : false;
        });

        let doneTaskCount = computed(() => props.card.tasks.filter((t) => t.done).length);

        let initialsFor = (name) => {
            if (!name) return "?";
            return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        };

        let onDragStart = (event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("application/json", JSON.stringify({ cardId: props.card.id, fromStatus: props.card.status }));
            emit("dragstart", props.card.id);
        };

        return { formattedDueDate, isOverdue, doneTaskCount, initialsFor, onDragStart };
    },
};
</script>

<style scoped>
.card-tile {
    background: #ffffff;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
    cursor: grab;
    margin-bottom: 10px;
}

.card-tile:active {
    cursor: grabbing;
}

.card-tile.not-draggable {
    cursor: pointer;
}

.priority-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.priority-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 10px;
    letter-spacing: 0.04em;
}

.priority-low {
    background: var(--color-border);
    color: var(--color-text-muted);
}

.priority-medium {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
}

.priority-high {
    background: #ffedd5;
    color: #c2410c;
}

.priority-critical {
    background: #fee2e2;
    color: var(--color-danger);
}

.multi-project-badge {
    font-size: 10px;
    color: var(--color-text-muted);
}

.card-title {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--color-text);
    word-break: break-word;
}

.card-meta {
    display: flex;
    gap: 10px;
    font-size: 11px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
}

.due-date.overdue {
    color: var(--color-danger);
    font-weight: 600;
}

.assignee-avatars {
    display: flex;
}

.assignee-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -6px;
    border: 2px solid #ffffff;
}

.assignee-avatar:first-child {
    margin-left: 0;
}
</style>
