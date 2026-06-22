<template>
    <div class="chat-container">
        <form class="input-area" @submit.prevent="submit">
            <textarea
                placeholder="Message the team about this card..."
                v-model="message"
                @keypress.enter.prevent="submit"
            ></textarea>
            <button class="send-button" type="submit">Send</button>
        </form>
    </div>
</template>

<script>
import { ref } from "vue";

export default {
    emits: ["send"],
    setup(props, { emit }) {
        let message = ref("");
        let submit = () => {
            if (!message.value.trim()) return;
            emit("send", message.value);
            message.value = "";
        };
        return { message, submit };
    },
};
</script>

<style scoped>
.chat-container {
    border-top: 1px solid var(--color-border);
}

.input-area {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 12px;
}

textarea {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    resize: none;
    font-size: 13px;
    font-family: inherit;
    min-height: 40px;
    max-height: 120px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.send-button {
    flex-shrink: 0;
}
</style>
