<template>
    <div>
        <Navbar></Navbar>
        <div class="messages-page">
            <div class="sidebar">
                <div class="sidebar-header">
                    <h2>Messages</h2>
                    <button type="button" @click="showNewConversation = true">+ New</button>
                </div>
                <ConversationList
                    :conversations="conversations"
                    :active-id="activeId"
                    @select="onSelectConversation"
                ></ConversationList>
            </div>

            <div class="thread-pane">
                <template v-if="activeConversation">
                    <div class="thread-header">
                        <h3>{{ activeConversation.name }}</h3>
                        <p v-if="activeConversation.type === 'group'" class="thread-participants">
                            {{ activeConversation.participants.map((p) => p.displayName).join(", ") }}
                        </p>
                    </div>
                    <CardChatWindow :messages="chat.messages"></CardChatWindow>
                    <CardChatForm @send="onSendMessage"></CardChatForm>
                </template>
                <div v-else class="empty-thread">
                    <p>Select a conversation or start a new one.</p>
                </div>
            </div>
        </div>

        <NewConversationModal
            v-if="showNewConversation"
            :error="error"
            @submit="onCreateConversation"
            @cancel="showNewConversation = false"
        ></NewConversationModal>
    </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import ConversationList from "@/components/ConversationList.vue";
import NewConversationModal from "@/components/NewConversationModal.vue";
import CardChatWindow from "@/components/CardChatWindow.vue";
import CardChatForm from "@/components/CardChatForm.vue";
import { useConversations } from "@/composable/UseConversations";
import { useConversationChat } from "@/composable/UseConversationChat";
import { getUser } from "@/composable/Getuser";

export default {
    components: { Navbar, ConversationList, NewConversationModal, CardChatWindow, CardChatForm },
    setup() {
        let { conversations, error, fetchConversations, createConversation, markConversationRead, subscribeToLive, touchConversation } = useConversations();
        let { user } = getUser();
        let router = useRouter();
        let activeId = ref(null);
        let showNewConversation = ref(false);
        let chat = ref(null);

        watch(user, () => {
            if (!user.value) {
                router.push("/");
            }
        });

        onMounted(async () => {
            subscribeToLive();
            await fetchConversations();
        });

        onUnmounted(() => {
            if (chat.value) chat.value.leave();
        });

        let activeConversation = computed(() => conversations.value.find((c) => c.id === activeId.value) || null);

        let onSelectConversation = async (conversationId) => {
            if (chat.value) chat.value.leave();
            activeId.value = conversationId;
            chat.value = useConversationChat(conversationId);
            await chat.value.fetchHistory();
            chat.value.join();
            await markConversationRead(conversationId);
        };

        let onSendMessage = (text) => {
            if (!chat.value) return;
            chat.value.sendMessage(text);
            touchConversation(activeId.value, text);
        };

        let onCreateConversation = async (payload) => {
            let conversation = await createConversation(payload);
            if (conversation) {
                showNewConversation.value = false;
                await onSelectConversation(conversation.id);
            }
        };

        return {
            conversations, error, activeId, activeConversation, showNewConversation, chat,
            onSelectConversation, onCreateConversation, onSendMessage,
        };
    },
};
</script>

<style scoped>
.messages-page {
    display: flex;
    height: calc(100vh - 73px);
    max-width: 1400px;
    margin: 0 auto;
}

.sidebar {
    width: 320px;
    flex-shrink: 0;
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
}

.sidebar-header h2 {
    margin: 0;
    font-size: 17px;
}

.thread-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.thread-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
}

.thread-header h3 {
    margin: 0;
}

.thread-participants {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--color-text-muted);
}

.thread-pane :deep(.chat-window) {
    flex: 1;
}

.thread-pane :deep(.messages) {
    max-height: none;
    height: 100%;
}

.empty-thread {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: 14px;
}

@media (max-width: 700px) {
    .messages-page {
        flex-direction: column;
        height: auto;
    }

    .sidebar {
        width: 100%;
        max-height: 40vh;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
    }

    .thread-pane :deep(.messages) {
        max-height: 50vh;
    }
}
</style>
