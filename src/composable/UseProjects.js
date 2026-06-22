import { ref } from "vue";
import api from "@/api/config";

function useProjects() {
    let projects = ref([]);
    let publicProjects = ref([]);
    let currentProject = ref(null);
    let error = ref("");

    let fetchProjects = async () => {
        try {
            let res = await api.get("/api/projects");
            projects.value = res.data;
            error.value = "";
        } catch (err) {
            error.value = "Could not load projects. Please try again.";
        }
    };

    let fetchProject = async (projectId) => {
        try {
            let res = await api.get(`/api/projects/${projectId}`);
            currentProject.value = res.data;
            error.value = "";
        } catch (err) {
            error.value = "Could not load project. Please try again.";
        }
    };

    let fetchPublicProjects = async () => {
        try {
            let res = await api.get("/api/projects/public");
            publicProjects.value = res.data;
            error.value = "";
        } catch (err) {
            error.value = "Could not load public projects. Please try again.";
        }
    };

    let createProject = async (name, description, visibility) => {
        try {
            let res = await api.post("/api/projects", { name, description, visibility });
            projects.value.unshift(res.data);
            error.value = "";
            return res.data;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;
            if (code === "MISSING_FIELDS" || code === "INVALID_NAME") {
                error.value = err.response.data.message;
            } else {
                error.value = "Could not create project. Please try again.";
            }
            return null;
        }
    };

    let updateVisibility = async (projectId, visibility) => {
        try {
            let res = await api.put(`/api/projects/${projectId}/visibility`, { visibility });
            let index = projects.value.findIndex((p) => p.id === projectId);
            if (index !== -1) projects.value[index] = res.data;
            if (currentProject.value && currentProject.value.id === projectId) currentProject.value = res.data;
            error.value = "";
            return res.data;
        } catch (err) {
            error.value = "Could not update visibility. Please try again.";
            return null;
        }
    };

    let joinProject = async (projectId) => {
        try {
            let res = await api.post(`/api/projects/${projectId}/join`);
            if (currentProject.value && currentProject.value.id === projectId) currentProject.value = res.data;
            error.value = "";
            return res.data;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;
            if (code === "NOT_PUBLIC" || code === "ALREADY_MEMBER") {
                error.value = err.response.data.message;
            } else {
                error.value = "Could not join project. Please try again.";
            }
            return null;
        }
    };

    let updateProject = async (projectId, patch) => {
        try {
            let res = await api.put(`/api/projects/${projectId}`, patch);
            let index = projects.value.findIndex((p) => p.id === projectId);
            if (index !== -1) projects.value[index] = res.data;
            error.value = "";
            return res.data;
        } catch (err) {
            error.value = "Could not update project. Please try again.";
            return null;
        }
    };

    let deleteProject = async (projectId) => {
        try {
            await api.delete(`/api/projects/${projectId}`);
            projects.value = projects.value.filter((p) => p.id !== projectId);
            error.value = "";
            return true;
        } catch (err) {
            error.value = "Could not delete project. Please try again.";
            return false;
        }
    };

    let addMember = async (projectId, email, role) => {
        try {
            let res = await api.post(`/api/projects/${projectId}/members`, { email, role });
            let index = projects.value.findIndex((p) => p.id === projectId);
            if (index !== -1) projects.value[index] = res.data;
            if (currentProject.value && currentProject.value.id === projectId) currentProject.value = res.data;
            error.value = "";
            return res.data;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;
            if (code === "USER_NOT_FOUND") {
                error.value = "No account found with this email.";
            } else if (code === "ALREADY_MEMBER") {
                error.value = "This user is already a member of the project.";
            } else if (code === "INVALID_ROLE" || code === "FORBIDDEN") {
                error.value = err.response.data.message;
            } else {
                error.value = "Could not add member. Please try again.";
            }
            return null;
        }
    };

    let updateMemberRole = async (projectId, userId, role) => {
        try {
            let res = await api.put(`/api/projects/${projectId}/members/${userId}/role`, { role });
            let index = projects.value.findIndex((p) => p.id === projectId);
            if (index !== -1) projects.value[index] = res.data;
            if (currentProject.value && currentProject.value.id === projectId) currentProject.value = res.data;
            error.value = "";
            return res.data;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;
            if (code === "FORBIDDEN" || code === "CANNOT_CHANGE_OWNER_ROLE") {
                error.value = err.response.data.message;
            } else {
                error.value = "Could not update member role. Please try again.";
            }
            return null;
        }
    };

    let removeMember = async (projectId, userId) => {
        try {
            let res = await api.delete(`/api/projects/${projectId}/members/${userId}`);
            let index = projects.value.findIndex((p) => p.id === projectId);
            if (index !== -1) projects.value[index] = res.data;
            if (currentProject.value && currentProject.value.id === projectId) currentProject.value = res.data;
            error.value = "";
            return res.data;
        } catch (err) {
            error.value = "Could not remove member. Please try again.";
            return null;
        }
    };

    let joinRequests = ref([]);

    let requestToJoin = async (projectId) => {
        try {
            await api.post(`/api/projects/${projectId}/join-requests`);
            error.value = "";
            return true;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;
            if (code === "ALREADY_REQUESTED" || code === "ALREADY_MEMBER" || code === "NOT_PRIVATE") {
                error.value = err.response.data.message;
            } else {
                error.value = "Could not send join request. Please try again.";
            }
            return false;
        }
    };

    let fetchJoinRequests = async (projectId) => {
        try {
            let res = await api.get(`/api/projects/${projectId}/join-requests`);
            joinRequests.value = res.data;
        } catch (err) {
            // only the owner sees this section
        }
    };

    let approveJoinRequest = async (projectId, requestId, role) => {
        try {
            await api.post(`/api/projects/${projectId}/join-requests/${requestId}/approve`, { role });
            joinRequests.value = joinRequests.value.filter((r) => r.id !== requestId);
            await fetchProject(projectId);
        } catch (err) {
            error.value = "Could not approve join request. Please try again.";
        }
    };

    let denyJoinRequest = async (projectId, requestId) => {
        try {
            await api.post(`/api/projects/${projectId}/join-requests/${requestId}/deny`);
            joinRequests.value = joinRequests.value.filter((r) => r.id !== requestId);
        } catch (err) {
            error.value = "Could not deny join request. Please try again.";
        }
    };

    return {
        projects, publicProjects, currentProject, error, joinRequests,
        fetchProjects, fetchPublicProjects, fetchProject,
        createProject, updateProject, updateVisibility, deleteProject,
        addMember, removeMember, updateMemberRole, joinProject,
        requestToJoin, fetchJoinRequests, approveJoinRequest, denyJoinRequest,
    };
}

export { useProjects };
