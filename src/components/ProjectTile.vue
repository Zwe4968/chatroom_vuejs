<template>
    <div class="project-tile" tabindex="0" role="button" @click="$emit('open', project.id)" @keyup.enter="$emit('open', project.id)">
        <div class="badge-row">
            <span class="visibility-badge" :class="project.visibility">{{ project.visibility === "public" ? "Public" : "Private" }}</span>
            <span v-if="project.myRole" class="role-badge">{{ project.myRole }}</span>
        </div>
        <h3 class="project-name">{{ project.name }}</h3>
        <p class="project-description">{{ project.description || "No description yet." }}</p>
        <div class="project-footer">
            <div class="member-avatars">
                <div v-for="m in project.members.slice(0, 4)" :key="m.userId" class="member-avatar" :title="m.displayName">
                    {{ initialsFor(m.displayName) }}
                </div>
                <div v-if="project.members.length > 4" class="member-avatar extra">+{{ project.members.length - 4 }}</div>
            </div>
            <span v-if="project.myRole" class="member-count">{{ project.members.length }} member{{ project.members.length === 1 ? "" : "s" }}</span>
            <button v-else type="button" class="join-btn" @click.stop="$emit('join', project.id)">Join</button>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        project: { type: Object, required: true },
    },
    emits: ["open", "join"],
    setup() {
        let initialsFor = (name) => {
            if (!name) return "";
            return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        };
        return { initialsFor };
    },
};
</script>

<style scoped>
.project-tile {
    background: #ffffff;
    border-radius: var(--radius);
    padding: 18px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.project-tile:hover,
.project-tile:focus {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
    outline: none;
}

.badge-row {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
}

.visibility-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--color-border);
    color: var(--color-text-muted);
}

.visibility-badge.public {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
}

.role-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: capitalize;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--color-bg);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

.project-name {
    margin: 0 0 6px;
    font-size: 17px;
    color: var(--color-text);
}

.project-description {
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.project-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.member-avatars {
    display: flex;
}

.member-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: -8px;
    border: 2px solid #ffffff;
}

.member-avatar:first-child {
    margin-left: 0;
}

.member-avatar.extra {
    background: var(--color-text-muted);
}

.member-count {
    font-size: 12px;
    color: var(--color-text-muted);
}

.join-btn {
    padding: 4px 12px;
    font-size: 12px;
}
</style>
