<template>
    <div class="kanban-column" @dragover.prevent="onColumnDragOver" @drop.prevent="onDrop" @dragleave="onColumnDragLeave">
        <div class="column-header">
            <h3>{{ title }}</h3>
            <span class="column-count">{{ cards.length }}</span>
        </div>
        <div class="column-body">
            <div
                v-for="(card, index) in cards"
                :key="card.id"
                class="tile-wrapper"
                :class="{ 'drag-over-top': dragOverIndex === index && dragOverEdge === 'top', 'drag-over-bottom': dragOverIndex === index && dragOverEdge === 'bottom' }"
                @dragover.prevent="onTileDragOver($event, index)"
            >
                <CardTile :card="card" :draggable="!readOnly" @open="$emit('open-card', $event)"></CardTile>
            </div>

            <template v-if="!readOnly">
                <form v-if="addingCard" class="quick-add-form" @submit.prevent="submitNewCard">
                    <textarea v-model="newCardTitle" placeholder="Card title..." autofocus @keydown.esc="cancelAdd" @keypress.enter.prevent="submitNewCard"></textarea>
                    <div class="quick-add-actions">
                        <button type="submit">Add card</button>
                        <button type="button" class="cancel-btn" @click="cancelAdd">Cancel</button>
                    </div>
                </form>
                <button v-else type="button" class="add-card-btn" @click="addingCard = true">+ Add card</button>
            </template>
        </div>
    </div>
</template>

<script>
import { ref } from "vue";
import CardTile from "@/components/CardTile.vue";

export default {
    components: { CardTile },
    props: {
        status: { type: String, required: true },
        title: { type: String, required: true },
        cards: { type: Array, required: true },
        readOnly: { type: Boolean, default: false },
    },
    emits: ["open-card", "add-card", "card-dropped"],
    setup(props, { emit }) {
        let dragOverIndex = ref(null);
        let dragOverEdge = ref(null);
        let addingCard = ref(false);
        let newCardTitle = ref("");

        let submitNewCard = () => {
            if (!newCardTitle.value.trim()) return;
            emit("add-card", { status: props.status, title: newCardTitle.value.trim() });
            newCardTitle.value = "";
            addingCard.value = false;
        };

        let cancelAdd = () => {
            newCardTitle.value = "";
            addingCard.value = false;
        };

        let onTileDragOver = (event, index) => {
            let rect = event.currentTarget.getBoundingClientRect();
            let midpoint = rect.top + rect.height / 2;
            if (event.clientY < midpoint) {
                dragOverIndex.value = index;
                dragOverEdge.value = "top";
            } else {
                dragOverIndex.value = index;
                dragOverEdge.value = "bottom";
            }
        };

        let onColumnDragOver = () => {
            if (props.readOnly) return;
            if (dragOverIndex.value === null) {
                dragOverIndex.value = props.cards.length;
                dragOverEdge.value = "bottom";
            }
        };

        let onColumnDragLeave = (event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                dragOverIndex.value = null;
                dragOverEdge.value = null;
            }
        };

        let resolveDropIndex = () => {
            if (dragOverIndex.value === null) return props.cards.length;
            return dragOverEdge.value === "bottom" ? dragOverIndex.value + 1 : dragOverIndex.value;
        };

        let onDrop = (event) => {
            if (props.readOnly) return;
            let raw = event.dataTransfer.getData("application/json");
            dragOverIndex.value = null;
            dragOverEdge.value = null;
            if (!raw) return;
            let { cardId, fromStatus } = JSON.parse(raw);
            let dropIndex = resolveDropIndex();

            let columnCards = props.cards.filter((c) => c.id !== cardId);
            let position = Math.max(0, Math.min(dropIndex, columnCards.length));
            if (fromStatus === props.status) {
                let currentIndex = props.cards.findIndex((c) => c.id === cardId);
                if (currentIndex !== -1 && dropIndex > currentIndex) {
                    position -= 1;
                }
            }

            emit("card-dropped", { cardId, status: props.status, position });
        };

        return { dragOverIndex, dragOverEdge, onTileDragOver, onColumnDragOver, onColumnDragLeave, onDrop, addingCard, newCardTitle, submitNewCard, cancelAdd };
    },
};
</script>

<style scoped>
.kanban-column {
    background: var(--color-bg);
    border-radius: var(--radius);
    padding: 12px;
    min-width: 260px;
    max-width: 300px;
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 220px);
}

@media (max-width: 600px) {
    .kanban-column {
        min-width: 82vw;
        max-width: 82vw;
        max-height: calc(100vh - 280px);
    }
}

.column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 12px;
}

.column-header h3 {
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
}

.column-count {
    background: var(--color-border);
    color: var(--color-text-muted);
    border-radius: 10px;
    padding: 2px 8px;
    font-size: 12px;
}

.column-body {
    overflow-y: auto;
    padding: 2px;
}

.tile-wrapper {
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
}

.tile-wrapper.drag-over-top {
    border-top-color: var(--color-primary);
}

.tile-wrapper.drag-over-bottom {
    border-bottom-color: var(--color-primary);
}

.add-card-btn {
    width: 100%;
    background: transparent;
    color: var(--color-text-muted);
    border: 1px dashed var(--color-border);
    box-shadow: none;
    margin-top: 4px;
}

.add-card-btn:hover {
    background: #ffffff;
    color: var(--color-primary);
    transform: none;
}

.quick-add-form {
    margin-top: 4px;
}

.quick-add-form textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--color-primary);
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    resize: none;
    min-height: 56px;
}

.quick-add-form textarea:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.quick-add-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
}

.quick-add-actions .cancel-btn {
    background: transparent;
    color: var(--color-text-muted);
    box-shadow: none;
}

.quick-add-actions .cancel-btn:hover {
    background: #ffffff;
    transform: none;
}
</style>
