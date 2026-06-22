<template>
    <div>
        <Navbar></Navbar>
        <div class="private-preview" v-if="project && project.isPrivatePreview">
            <h2>{{ project.name }}</h2>
            <p class="private-preview-text">This project is private. You'll need to request access from the owner or an admin.</p>
            <p v-if="error" class="error">{{ error }}</p>
            <button v-if="!requestSent" type="button" @click="onRequestToJoin">Request to join</button>
            <p v-else class="request-sent-text">Request sent — you'll be notified once it's reviewed.</p>
        </div>

        <div class="board-page" v-else-if="project">
            <div class="board-header">
                <div>
                    <router-link to="/projects" class="back-link">&larr; All projects</router-link>
                    <h1>{{ project.name }}</h1>
                    <span class="visibility-badge" :class="project.visibility">{{ project.visibility === "public" ? "Public" : "Private" }}</span>
                </div>
                <div class="header-actions">
                    <div class="member-avatars">
                        <div v-for="m in project.members" :key="m.userId" class="member-avatar" :title="m.displayName">
                            {{ initialsFor(m.displayName) }}
                        </div>
                    </div>
                    <button v-if="!project.myRole && project.visibility === 'public'" type="button" @click="onJoin">Join project</button>
                    <template v-if="isOwner">
                        <button type="button" class="ghost-btn" @click="toggleVisibility">
                            Make {{ project.visibility === "public" ? "Private" : "Public" }}
                        </button>
                    </template>
                    <button v-if="canManageMembers" type="button" @click="showInvite = !showInvite">+ Invite</button>
                    <button v-if="canManageMembers" type="button" class="ghost-btn" @click="showMembers = !showMembers">Members</button>
                </div>
            </div>

            <form v-if="showInvite" class="invite-form" @submit.prevent="submitInvite">
                <input v-model="inviteEmail" type="email" placeholder="teammate@example.com" required>
                <select v-model="inviteRole">
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin" :disabled="!isOwner">Admin</option>
                </select>
                <button type="submit">Send invite</button>
            </form>
            <p v-if="error" class="error">{{ error }}</p>

            <ProjectMembersPanel
                v-if="showMembers && canManageMembers"
                :project="project"
                :is-owner="isOwner"
                :join-requests="joinRequests"
                :can-approve-join-requests="canApproveJoinRequests"
                @change-role="onChangeRole"
                @remove="onRemoveMember"
                @approve-request="onApproveRequest"
                @deny-request="onDenyRequest"
            ></ProjectMembersPanel>

            <div v-if="!canWrite" class="read-only-banner">
                <span>
                    {{ project.myRole === "viewer" ? "You have view-only access to this project." : "You're viewing this public project — join to add cards and chat." }}
                </span>
                <button v-if="!requestSent" type="button" class="ghost-btn" @click="onRequestToJoin">Request full access</button>
                <span v-else class="request-sent-text">Request sent — waiting on review.</span>
            </div>

            <div class="board-columns">
                <KanbanColumn
                    v-for="column in columns"
                    :key="column.status"
                    :status="column.status"
                    :title="column.title"
                    :cards="column.cards"
                    :read-only="!canWrite"
                    @open-card="openCard"
                    @add-card="onAddCard"
                    @card-dropped="onCardDropped"
                ></KanbanColumn>
            </div>
        </div>

        <CardDetailModal
            v-if="selectedCard"
            :card="selectedCard"
            :project="project"
            :cards-store="cardsStore"
            :read-only="!canWrite"
            @close="selectedCardId = null"
        ></CardDetailModal>
    </div>
</template>

<script>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import KanbanColumn from "@/components/KanbanColumn.vue";
import CardDetailModal from "@/components/CardDetailModal.vue";
import ProjectMembersPanel from "@/components/ProjectMembersPanel.vue";
import { useProjects } from "@/composable/UseProjects";
import { useCards } from "@/composable/UseCards";
import { getUser } from "@/composable/Getuser";

const COLUMN_DEFS = [
    { status: "todo", title: "To Do" },
    { status: "in_progress", title: "In Progress" },
    { status: "review", title: "Review" },
    { status: "completed", title: "Completed" },
];

const WRITE_ROLES = ["owner", "admin", "member"];
const MANAGE_ROLES = ["owner", "admin"];

export default {
    components: { Navbar, KanbanColumn, CardDetailModal, ProjectMembersPanel },
    props: {
        projectId: { type: String, required: true },
    },
    setup(props) {
        let {
            currentProject: project, error: projectError, joinRequests, fetchProject,
            addMember, removeMember, updateMemberRole, updateVisibility, joinProject,
            requestToJoin, fetchJoinRequests, approveJoinRequest, denyJoinRequest,
        } = useProjects();
        let cardsStore = useCards();
        let { user } = getUser();
        let router = useRouter();
        let selectedCardId = ref(null);
        let showInvite = ref(false);
        let showMembers = ref(false);
        let inviteEmail = ref("");
        let inviteRole = ref("member");
        let requestSent = ref(false);

        onMounted(async () => {
            await fetchProject(props.projectId);
            if (project.value && project.value.isPrivatePreview) return;
            await cardsStore.fetchCardsForProject(props.projectId);
            if (MANAGE_ROLES.includes(project.value.myRole)) {
                await fetchJoinRequests(props.projectId);
            }
        });

        watch(user, () => {
            if (!user.value) {
                router.push("/");
            }
        });

        let isOwner = computed(() => !!project.value && project.value.myRole === "owner");
        let canManageMembers = computed(() => !!project.value && MANAGE_ROLES.includes(project.value.myRole));
        let canApproveJoinRequests = computed(() => !!project.value && MANAGE_ROLES.includes(project.value.myRole));
        let canWrite = computed(() => !!project.value && WRITE_ROLES.includes(project.value.myRole));

        let columns = computed(() => {
            return COLUMN_DEFS.map((def) => ({
                ...def,
                cards: cardsStore.cards.value
                    .filter((c) => c.status === def.status)
                    .sort((a, b) => a.position - b.position),
            }));
        });

        let selectedCard = computed(() => {
            return cardsStore.cards.value.find((c) => c.id === selectedCardId.value) || null;
        });

        let openCard = (cardId) => {
            selectedCardId.value = cardId;
        };

        let onAddCard = ({ status, title }) => {
            if (!canWrite.value) return;
            cardsStore.createCard({ title, status, projectIds: [props.projectId] });
        };

        let onCardDropped = ({ cardId, status, position }) => {
            if (!canWrite.value) return;
            cardsStore.reorderCard(cardId, status, position, props.projectId);
        };

        let submitInvite = async () => {
            let result = await addMember(props.projectId, inviteEmail.value.trim(), inviteRole.value);
            if (result) {
                inviteEmail.value = "";
                inviteRole.value = "member";
                showInvite.value = false;
            }
        };

        let onChangeRole = (userId, role) => {
            updateMemberRole(props.projectId, userId, role);
        };

        let onRemoveMember = (userId) => {
            removeMember(props.projectId, userId);
        };

        let toggleVisibility = () => {
            let next = project.value.visibility === "public" ? "private" : "public";
            updateVisibility(props.projectId, next);
        };

        let onJoin = async () => {
            let joined = await joinProject(props.projectId);
            if (joined) {
                await cardsStore.fetchCardsForProject(props.projectId);
            }
        };

        let onRequestToJoin = async () => {
            let sent = await requestToJoin(props.projectId);
            if (sent) requestSent.value = true;
        };

        let onApproveRequest = (requestId, role) => {
            approveJoinRequest(props.projectId, requestId, role);
        };

        let onDenyRequest = (requestId) => {
            denyJoinRequest(props.projectId, requestId);
        };

        let initialsFor = (name) => {
            if (!name) return "";
            return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        };

        return {
            project, error: projectError, columns, selectedCard, selectedCardId, cardsStore,
            showInvite, showMembers, inviteEmail, inviteRole, submitInvite, joinRequests, requestSent,
            isOwner, canManageMembers, canApproveJoinRequests, canWrite,
            openCard, onAddCard, onCardDropped, onChangeRole, onRemoveMember, toggleVisibility, onJoin, initialsFor,
            onRequestToJoin, onApproveRequest, onDenyRequest,
        };
    },
};
</script>

<style scoped>
.private-preview {
    max-width: 480px;
    margin: 80px auto;
    padding: 32px;
    text-align: center;
    background: #ffffff;
    border-radius: var(--radius);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.private-preview h2 {
    margin: 0 0 12px;
}

.private-preview-text {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-bottom: 20px;
}

.request-sent-text {
    color: var(--color-primary-dark);
    font-size: 14px;
}

.board-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 24px 0;
}

.board-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
}

.back-link {
    display: inline-block;
    margin-right: 10px;
    font-size: 13px;
    color: var(--color-text-muted);
    text-decoration: none;
}

.board-header h1 {
    margin: 4px 0 6px;
    font-size: 22px;
    display: inline-block;
}

.visibility-badge {
    margin-left: 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--color-border);
    color: var(--color-text-muted);
    vertical-align: middle;
}

.visibility-badge.public {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.ghost-btn {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    box-shadow: none;
}

.ghost-btn:hover {
    background: var(--color-primary-light);
    transform: none;
}

.member-avatars {
    display: flex;
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
    margin-left: -8px;
    border: 2px solid #ffffff;
}

.member-avatar:first-child {
    margin-left: 0;
}

.invite-form {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    max-width: 480px;
}

.invite-form input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 13px;
    font-family: inherit;
}

.invite-form select {
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 13px;
    font-family: inherit;
}

.invite-form input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.read-only-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    padding: 10px 14px;
    border-radius: var(--radius);
    font-size: 13px;
    margin-bottom: 16px;
}

.read-only-banner .request-sent-text {
    font-size: 12px;
    font-weight: 600;
}

.board-columns {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 24px;
    scroll-snap-type: x proximity;
}

@media (max-width: 700px) {
    .board-page {
        padding: 16px 16px 0;
    }

    .board-header h1 {
        font-size: 19px;
    }

    .header-actions {
        width: 100%;
    }

    .header-actions button {
        flex: 1;
        min-width: 0;
    }

    .invite-form {
        flex-wrap: wrap;
        max-width: 100%;
    }

    .invite-form input,
    .invite-form select,
    .invite-form button {
        flex: 1 1 100%;
    }

    .board-columns > * {
        scroll-snap-align: start;
    }
}
</style>
