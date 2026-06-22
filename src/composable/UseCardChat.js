import { ref } from "vue";
import api from "@/api/config";
import { getSocket } from "@/socket";

function useCardChat(cardId) {
    let messages = ref([]);
    let error = ref(null);
    let connected = ref(false);

    let onNewMessage = (msg) => {
        if (msg.cardId === cardId) {
            messages.value.push(msg);
        }
    };

    let fetchHistory = async () => {
        try {
            let res = await api.get(`/api/card-messages/${cardId}`);
            messages.value = res.data;
            error.value = null;
        } catch (err) {
            error.value = "Could not load chat history.";
        }
    };

    let join = () => {
        getSocket().on("card:message:new", onNewMessage);
        getSocket().emit("card:join", { cardId }, (res) => {
            connected.value = !!(res && res.ok);
        });
    };

    let leave = () => {
        getSocket().emit("card:leave", { cardId });
        getSocket().off("card:message:new", onNewMessage);
        connected.value = false;
    };

    let sendMessage = (text) => {
        try {
            getSocket().emit("card:message:send", { cardId, message: text });
        } catch (err) {
            error.value = "Could not send message.";
        }
    };

    return { messages, error, connected, fetchHistory, join, leave, sendMessage };
}

export { useCardChat };
