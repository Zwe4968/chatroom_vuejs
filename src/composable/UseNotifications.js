import { ref } from "vue";
import api from "@/api/config";
import { getSocket } from "@/socket";

let notifications = ref([]);
let unreadCount = ref(0);
let subscribed = false;

async function fetchNotifications() {
    try {
        let res = await api.get("/api/notifications");
        notifications.value = res.data;
    } catch (err) {
        // ignore - bell just stays empty
    }
}

async function fetchUnreadCount() {
    try {
        let res = await api.get("/api/notifications/unread-count");
        unreadCount.value = res.data.count;
    } catch (err) {
        // ignore
    }
}

async function markRead(id) {
    let notification = notifications.value.find((n) => n.id === id);
    if (notification && !notification.read) {
        notification.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
    try {
        await api.put(`/api/notifications/${id}/read`);
    } catch (err) {
        // ignore
    }
}

async function markAllRead() {
    notifications.value.forEach((n) => { n.read = true; });
    unreadCount.value = 0;
    try {
        await api.put("/api/notifications/read-all");
    } catch (err) {
        // ignore
    }
}

function subscribeToLive() {
    if (subscribed) return;
    subscribed = true;
    getSocket().on("notification:new", (notification) => {
        notifications.value.unshift(notification);
        unreadCount.value += 1;
    });
}

function useNotifications() {
    return { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead, subscribeToLive };
}

export { useNotifications };
