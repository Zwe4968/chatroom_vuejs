<template>
  <div class="bell-wrap">
    <button class="bell-btn" @click="toggleOpen" :aria-label="`Notifications (${unreadCount} unread)`">
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <div v-if="open" class="dropdown">
      <div class="dropdown-header">
        <span>Notifications</span>
        <button v-if="unreadCount > 0" class="mark-all-btn" @click="markAllRead">Mark all read</button>
      </div>

      <div v-if="!notifications.length" class="empty-state">No notifications yet.</div>

      <div v-else class="notification-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notification-item"
          :class="{ unread: !n.read }"
          @click="openNotification(n)"
        >
          <p class="notification-message">{{ n.message }}</p>
          <p class="notification-time">{{ relativeTime(n.createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/composable/UseNotifications";

export default {
  setup() {
    let { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead, subscribeToLive } = useNotifications();
    let router = useRouter();
    let open = ref(false);

    let toggleOpen = () => {
      open.value = !open.value;
    };

    let closeOnOutsideClick = (e) => {
      if (!e.target.closest(".bell-wrap")) {
        open.value = false;
      }
    };

    let relativeTime = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

    let openNotification = async (n) => {
      await markRead(n.id);
      open.value = false;
      router.push(`/projects/${n.projectId}`);
    };

    onMounted(() => {
      fetchNotifications();
      fetchUnreadCount();
      subscribeToLive();
      document.addEventListener("click", closeOnOutsideClick);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("click", closeOnOutsideClick);
    });

    return { notifications, unreadCount, open, toggleOpen, relativeTime, openNotification, markAllRead };
  },
};
</script>

<style scoped>
.bell-wrap {
  position: relative;
}

.bell-btn {
  position: relative;
  background: transparent;
  border: none;
  box-shadow: none;
  font-size: 18px;
  padding: 6px;
  cursor: pointer;
  line-height: 1;
}

.bell-btn:hover {
  transform: none;
  background: var(--color-primary-light);
  border-radius: 50%;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #e23636;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 5px;
  line-height: 1.4;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  z-index: 50;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 700;
  font-size: 14px;
}

.mark-all-btn {
  background: transparent;
  border: none;
  box-shadow: none;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
}

.mark-all-btn:hover {
  transform: none;
  text-decoration: underline;
}

.empty-state {
  padding: 24px 14px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  text-align: left;
}

.notification-item:hover {
  background: var(--color-primary-light);
}

.notification-item.unread {
  background: rgba(99, 102, 241, 0.06);
}

.notification-message {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--color-text);
}

.notification-time {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-muted);
}

@media (max-width: 600px) {
  .dropdown {
    position: fixed;
    top: 64px;
    right: 8px;
    left: 8px;
    width: auto;
  }
}
</style>
