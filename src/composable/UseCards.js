import { ref } from "vue";
import api from "@/api/config";

function useCards() {
    let cards = ref([]);
    let error = ref("");
    let currentProjectId = ref(null);

    let replaceCard = (updated) => {
        let index = cards.value.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
            cards.value[index] = updated;
        } else {
            cards.value.push(updated);
        }
    };

    let fetchCardsForProject = async (projectId) => {
        currentProjectId.value = projectId;
        try {
            let res = await api.get(`/api/cards/project/${projectId}`);
            cards.value = res.data;
            error.value = "";
        } catch (err) {
            error.value = "Could not load cards. Please try again.";
        }
    };

    let createCard = async (payload) => {
        try {
            let res = await api.post("/api/cards", payload);
            cards.value.push(res.data);
            error.value = "";
            return res.data;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;
            if (code === "MISSING_FIELDS" || code === "INVALID_STATUS" || code === "INVALID_PRIORITY") {
                error.value = err.response.data.message;
            } else {
                error.value = "Could not create card. Please try again.";
            }
            return null;
        }
    };

    let updateCard = async (cardId, patch) => {
        try {
            let res = await api.put(`/api/cards/${cardId}`, patch);
            replaceCard(res.data);
            error.value = "";
            return res.data;
        } catch (err) {
            error.value = "Could not update card. Please try again.";
            return null;
        }
    };

    let deleteCard = async (cardId) => {
        try {
            await api.delete(`/api/cards/${cardId}`);
            cards.value = cards.value.filter((c) => c.id !== cardId);
            error.value = "";
            return true;
        } catch (err) {
            error.value = "Could not delete card. Please try again.";
            return false;
        }
    };

    let reorderCard = async (cardId, status, position, projectId) => {
        let card = cards.value.find((c) => c.id === cardId);
        let previousStatus = card ? card.status : null;
        let previousPosition = card ? card.position : null;
        if (card) {
            card.status = status;
            card.position = position;
        }
        try {
            await api.put(`/api/cards/${cardId}/reorder`, { status, position, projectId });
            error.value = "";
        } catch (err) {
            if (card) {
                card.status = previousStatus;
                card.position = previousPosition;
            }
            error.value = "Could not reorder card. Please try again.";
        } finally {
            if (currentProjectId.value) {
                await fetchCardsForProject(currentProjectId.value);
            }
        }
    };

    let addTask = async (cardId, text) => {
        let res = await api.post(`/api/cards/${cardId}/tasks`, { text });
        replaceCard(res.data);
        return res.data;
    };

    let updateTask = async (cardId, taskId, patch) => {
        let res = await api.put(`/api/cards/${cardId}/tasks/${taskId}`, patch);
        replaceCard(res.data);
        return res.data;
    };

    let removeTask = async (cardId, taskId) => {
        let res = await api.delete(`/api/cards/${cardId}/tasks/${taskId}`);
        replaceCard(res.data);
        return res.data;
    };

    let addLink = async (cardId, label, url) => {
        let res = await api.post(`/api/cards/${cardId}/links`, { label, url });
        replaceCard(res.data);
        return res.data;
    };

    let removeLink = async (cardId, linkId) => {
        let res = await api.delete(`/api/cards/${cardId}/links/${linkId}`);
        replaceCard(res.data);
        return res.data;
    };

    let addNote = async (cardId, text) => {
        let res = await api.post(`/api/cards/${cardId}/notes`, { text });
        replaceCard(res.data);
        return res.data;
    };

    let removeNote = async (cardId, noteId) => {
        let res = await api.delete(`/api/cards/${cardId}/notes/${noteId}`);
        replaceCard(res.data);
        return res.data;
    };

    let addAcknowledgement = async (cardId, type) => {
        let res = await api.post(`/api/cards/${cardId}/acknowledgements`, { type });
        replaceCard(res.data);
        return res.data;
    };

    let removeAcknowledgement = async (cardId, ackId) => {
        let res = await api.delete(`/api/cards/${cardId}/acknowledgements/${ackId}`);
        replaceCard(res.data);
        return res.data;
    };

    return {
        cards, error,
        fetchCardsForProject, createCard, updateCard, deleteCard, reorderCard,
        addTask, updateTask, removeTask,
        addLink, removeLink,
        addNote, removeNote,
        addAcknowledgement, removeAcknowledgement,
    };
}

export { useCards };
