<template>
    <div class="conversation-list">
        <p v-if="!conversations.length" class="empty-state">No conversations yet.</p>
        <div
            v-for="conversation in conversations"
            :key="conversation.id"
            class="conversation-row"
            :class="{ active: conversation.id === activeId, unread: conversation.unreadCount > 0 }"
            @click="$emit('select', conversation.id)"
        >
            <div class="conversation-avatar">{{ initialsFor(conversation.name) }}</div>
            <div class="conversation-info">
                <p class="conversation-name">{{ conversation.name }}</p>
                <p class="conversation-preview">{{ conversation.lastMessage || "No messages yet" }}</p>
            </div>
            <span v-if="conversation.unreadCount > 0" class="unread-badge">{{ conversation.unreadCount > 9 ? "9+" : conversation.unreadCount }}</span>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        conversations: { type: Array, required: true },
        activeId: { type: String, default: null },
    },
    emits: ["select"],
    setup() {
        let initialsFor = (name) => {
            if (!name) return "?";
            return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        };
        return { initialsFor };
    },
};
</script>

<style scoped>
.conversation-list {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 13px;
}

.conversation-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);
}

.conversation-row:hover {
    background: var(--color-primary-light);
}

.conversation-row.active {
    background: var(--color-primary-light);
}

.conversation-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--color-primary);
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.conversation-info {
    flex: 1;
    min-width: 0;
}

.conversation-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
}

.conversation-row.unread .conversation-name {
    font-weight: 800;
}

.conversation-preview {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.unread-badge {
    background: var(--color-primary);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 999px;
    padding: 2px 7px;
    flex-shrink: 0;
}
</style>
