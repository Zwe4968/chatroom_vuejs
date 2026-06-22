import { ref } from "vue";
import api from "@/api/config";
import { getSocket } from "@/socket";

function useConversationChat(conversationId) {
    let messages = ref([]);
    let error = ref(null);
    let connected = ref(false);

    let onNewMessage = (msg) => {
        if (msg.conversationId === conversationId) {
            messages.value.push(msg);
        }
    };

    let fetchHistory = async () => {
        try {
            let res = await api.get(`/api/conversations/${conversationId}/messages`);
            messages.value = res.data;
            error.value = null;
        } catch (err) {
            error.value = "Could not load conversation history.";
        }
    };

    let join = () => {
        getSocket().on("conversation:message:new", onNewMessage);
        getSocket().emit("conversation:join", { conversationId }, (res) => {
            connected.value = !!(res && res.ok);
        });
    };

    let leave = () => {
        getSocket().emit("conversation:leave", { conversationId });
        getSocket().off("conversation:message:new", onNewMessage);
        connected.value = false;
    };

    let sendMessage = (text) => {
        try {
            getSocket().emit("conversation:message:send", { conversationId, message: text });
        } catch (err) {
            error.value = "Could not send message.";
        }
    };

    return { messages, error, connected, fetchHistory, join, leave, sendMessage };
}

export { useConversationChat };
