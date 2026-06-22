<template>
    <div class="members-panel">
        <template v-if="canApproveJoinRequests && joinRequests.length">
            <h4>Pending requests</h4>
            <div v-for="request in joinRequests" :key="request.id" class="member-row">
                <div class="member-avatar">{{ initialsFor(request.displayName) }}</div>
                <div class="member-info">
                    <p class="member-name">{{ request.displayName }}</p>
                    <p class="member-email">{{ request.email }}</p>
                </div>
                <select
                    :value="approveRoles[request.id] || 'member'"
                    @change="approveRoles[request.id] = $event.target.value"
                >
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="admin" :disabled="!isOwner">Admin</option>
                </select>
                <button type="button" class="ghost-btn" @click="$emit('approve-request', request.id, approveRoles[request.id] || 'member')">Approve</button>
                <button type="button" class="remove-btn" @click="$emit('deny-request', request.id)">&times;</button>
            </div>
        </template>

        <h4>Members</h4>
        <div v-for="member in project.members" :key="member.userId" class="member-row">
            <div class="member-avatar">{{ initialsFor(member.displayName) }}</div>
            <div class="member-info">
                <p class="member-name">{{ member.displayName }}</p>
                <p class="member-email">{{ member.email }}</p>
            </div>
            <select
                v-if="member.userId !== project.ownerId"
                :value="member.role"
                @change="$emit('change-role', member.userId, $event.target.value)"
            >
                <option value="admin" :disabled="!isOwner">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
            </select>
            <span v-else class="owner-tag">Owner</span>
            <button v-if="member.userId !== project.ownerId" type="button" class="remove-btn" @click="$emit('remove', member.userId)">&times;</button>
        </div>
    </div>
</template>

<script>
import { reactive } from "vue";

export default {
    props: {
        project: { type: Object, required: true },
        isOwner: { type: Boolean, default: false },
        joinRequests: { type: Array, default: () => [] },
        canApproveJoinRequests: { type: Boolean, default: false },
    },
    emits: ["change-role", "remove", "approve-request", "deny-request"],
    setup() {
        let approveRoles = reactive({});

        let initialsFor = (name) => {
            if (!name) return "?";
            return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        };
        return { initialsFor, approveRoles };
    },
};
</script>

<style scoped>
.members-panel {
    background: #ffffff;
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.members-panel h4 {
    margin: 0 0 12px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
}

.member-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
}

.member-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.member-info {
    flex: 1;
    min-width: 0;
}

.member-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
}

.member-email {
    margin: 0;
    font-size: 11px;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.member-row select {
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 12px;
    font-family: inherit;
    text-transform: capitalize;
}

.member-row .ghost-btn {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    box-shadow: none;
    padding: 4px 10px;
    font-size: 12px;
}

.member-row .ghost-btn:hover {
    background: var(--color-primary-light);
    transform: none;
}

.owner-tag {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
}

.remove-btn {
    background: transparent;
    color: var(--color-text-muted);
    box-shadow: none;
    font-size: 16px;
    padding: 0 4px;
}

.remove-btn:hover {
    color: var(--color-danger);
    background: transparent;
    transform: none;
}

@media (max-width: 480px) {
    .member-row {
        flex-wrap: wrap;
    }

    .member-info {
        flex-basis: 100%;
        order: -1;
    }
}
</style>
