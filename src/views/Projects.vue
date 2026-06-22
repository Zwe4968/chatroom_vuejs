<template>
    <div>
        <Navbar></Navbar>
        <div class="dashboard">
            <div class="dashboard-header">
                <h1>Projects</h1>
                <button @click="showForm = true">+ New Project</button>
            </div>

            <div class="tab-row">
                <button v-for="tab in tabs" :key="tab.key" type="button" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="selectTab(tab.key)">
                    {{ tab.label }}
                </button>
            </div>

            <input v-if="activeTab !== 'activity'" v-model="search" type="text" class="search-input" placeholder="Search by name or description...">

            <p v-if="error" class="error">{{ error }}</p>

            <div v-if="activeTab === 'activity'" class="empty-state">Recent Activity is coming in Phase 3.</div>
            <template v-else>
                <p v-if="!filteredProjects.length && !error" class="empty-state">{{ emptyMessageFor(activeTab) }}</p>
                <div class="project-grid">
                    <ProjectTile v-for="project in filteredProjects" :key="project.id" :project="project" @open="openProject" @join="onJoin"></ProjectTile>
                </div>
            </template>
        </div>
        <ProjectForm v-if="showForm" :error="error" @submit="onCreate" @cancel="showForm = false"></ProjectForm>
    </div>
</template>

<script>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import ProjectTile from "@/components/ProjectTile.vue";
import ProjectForm from "@/components/ProjectForm.vue";
import { useProjects } from "@/composable/UseProjects";
import { getUser } from "@/composable/Getuser";

const TABS = [
    { key: "mine", label: "My Projects" },
    { key: "shared", label: "Shared Projects" },
    { key: "public", label: "Public Projects" },
    { key: "activity", label: "Recent Activity" },
];

export default {
    components: { Navbar, ProjectTile, ProjectForm },
    setup() {
        let { projects, publicProjects, error, fetchProjects, fetchPublicProjects, createProject, joinProject } = useProjects();
        let { user } = getUser();
        let router = useRouter();
        let showForm = ref(false);
        let activeTab = ref("mine");
        let search = ref("");

        onMounted(() => {
            fetchProjects();
            fetchPublicProjects();
        });

        watch(user, () => {
            if (!user.value) {
                router.push("/");
            }
        });

        let myProjects = computed(() => projects.value.filter((p) => p.ownerId === (user.value && user.value.uid)));
        let sharedProjects = computed(() => projects.value.filter((p) => p.ownerId !== (user.value && user.value.uid)));

        let activeList = computed(() => {
            if (activeTab.value === "mine") return myProjects.value;
            if (activeTab.value === "shared") return sharedProjects.value;
            if (activeTab.value === "public") return publicProjects.value;
            return [];
        });

        let filteredProjects = computed(() => {
            let term = search.value.trim().toLowerCase();
            if (!term) return activeList.value;
            return activeList.value.filter((p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
        });

        let emptyMessageFor = (tab) => {
            if (tab === "mine") return "You haven't created any projects yet.";
            if (tab === "shared") return "No one has shared a project with you yet.";
            return "No public projects to discover right now.";
        };

        let selectTab = (key) => {
            activeTab.value = key;
            search.value = "";
        };

        let openProject = (projectId) => {
            router.push({ name: "ProjectBoard", params: { projectId } });
        };

        let onJoin = async (projectId) => {
            let joined = await joinProject(projectId);
            if (joined) {
                await fetchProjects();
                await fetchPublicProjects();
            }
        };

        let onCreate = async ({ name, description, visibility }) => {
            let created = await createProject(name, description, visibility);
            if (created) {
                showForm.value = false;
            }
        };

        return { tabs: TABS, activeTab, search, error, showForm, filteredProjects, emptyMessageFor, selectTab, openProject, onJoin, onCreate };
    },
};
</script>

<style scoped>
.dashboard {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
}

.dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.dashboard-header h1 {
    margin: 0;
    font-size: 24px;
}

.tab-row {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.tab-btn {
    background: transparent;
    color: var(--color-text-muted);
    box-shadow: none;
    border-radius: 0;
    padding: 10px 4px;
    margin-right: 16px;
    font-weight: 600;
    border-bottom: 2px solid transparent;
}

.tab-btn:hover {
    background: transparent;
    color: var(--color-primary);
    transform: none;
}

.tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}

.search-input {
    width: 100%;
    max-width: 320px;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: 13px;
    font-family: inherit;
    margin-bottom: 20px;
}

.search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.empty-state {
    color: var(--color-text-muted);
    font-size: 14px;
}

.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
}

@media (max-width: 600px) {
    .dashboard {
        padding: 20px 16px;
    }

    .dashboard-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .dashboard-header button {
        width: 100%;
    }

    .tab-row {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .tab-btn {
        flex-shrink: 0;
        margin-right: 12px;
    }

    .search-input {
        max-width: 100%;
    }

    .project-grid {
        grid-template-columns: 1fr;
    }
}
</style>
