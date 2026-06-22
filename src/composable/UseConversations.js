import { computed, ref } from "vue";
import api from "@/api/config";
import { getSocket } from "@/socket";

let conversations = ref([]);
let error = ref("");
let subscribed = false;

let unreadTotal = computed(() => conversations.value.reduce((sum, c) => sum + c.unreadCount, 0));

async function fetchConversations() {
    try {
        let res = await api.get("/api/conversations");
        conversations.value = res.data;
        error.value = "";
    } catch (err) {
        error.value = "Could not load conversations. Please try again.";
    }
}

async function createConversation({ type, participantIds, name }) {
    try {
        let res = await api.post("/api/conversations", { type, participantIds, name });
        let index = conversations.value.findIndex((c) => c.id === res.data.id);
        if (index !== -1) {
            conversations.value[index] = res.data;
        } else {
            conversations.value.unshift(res.data);
        }
        error.value = "";
        return res.data;
    } catch (err) {
        let code = err.response && err.response.data && err.response.data.code;
        if (code === "MISSING_FIELDS" || code === "INVALID_PARTICIPANTS") {
            error.value = err.response.data.message;
        } else {
            error.value = "Could not start conversation. Please try again.";
        }
        return null;
    }
}

async function markConversationRead(conversationId) {
    let conversation = conversations.value.find((c) => c.id === conversationId);
    if (conversation) conversation.unreadCount = 0;
    try {
        await api.put(`/api/conversations/${conversationId}/read`);
    } catch (err) {
        // ignore
    }
}

function bumpConversation(conversationId, lastMessage) {
    let conversation = conversations.value.find((c) => c.id === conversationId);
    if (!conversation) {
        // conversation didn't exist on our last fetch (e.g. brand new) - just refetch the whole list
        fetchConversations();
        return;
    }
    conversation.lastMessage = lastMessage;
    conversation.lastMessageAt = new Date().toISOString();
    conversation.unreadCount += 1;
    conversations.value.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

function touchConversation(conversationId, lastMessage) {
    let conversation = conversations.value.find((c) => c.id === conversationId);
    if (!conversation) return;
    conversation.lastMessage = lastMessage;
    conversation.lastMessageAt = new Date().toISOString();
    conversations.value.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

function subscribeToLive() {
    if (subscribed) return;
    subscribed = true;
    getSocket().on("conversation:unread", ({ conversationId, message }) => {
        bumpConversation(conversationId, message);
    });
}

function useConversations() {
    return {
        conversations, error, unreadTotal,
        fetchConversations, createConversation, markConversationRead, subscribeToLive, touchConversation,
    };
}

export { useConversations };
