<template>
  <nav v-if="user">
    <div class="user-info" tabindex="0" role="button" @click="goToProfile" @keyup.enter="goToProfile">
        <img v-if="avatarSrc" :src="avatarSrc" class="avatar" alt="Avatar">
        <div v-else class="avatar">{{ initials }}</div>
        <div>
            <p class="display-name">{{ user.displayName }}</p>
            <p class="email">{{ user.email }}</p>
        </div>
    </div>
    <div class="nav-actions">
        <router-link to="/chatroom" class="nav-link">Chatroom</router-link>
        <router-link to="/projects" class="nav-link">Projects</router-link>
        <router-link to="/messages" class="nav-link messages-link">
            Messages
            <span v-if="unreadTotal > 0" class="badge">{{ unreadTotal > 9 ? "9+" : unreadTotal }}</span>
        </router-link>
        <NotificationBell />
        <button class="logout-btn" @click="logout">Logout</button>
    </div>
  </nav>
</template>

<script>
import { usersignout } from '@/composable/Userlogout';
import {getUser} from '@/composable/Getuser'
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import NotificationBell from '@/components/NotificationBell.vue';
import { onMounted } from 'vue';
import { useConversations } from '@/composable/UseConversations';

export default {
    components: { NotificationBell },

    setup(){
        let {user} = getUser();
        let {signoutted} = usersignout();
        let router = useRouter();
        let { unreadTotal, fetchConversations, subscribeToLive } = useConversations();

        onMounted(() => {
            if (user.value) {
                subscribeToLive();
                fetchConversations();
            }
        });

        let initials = computed(()=>{
            let name = user.value && user.value.displayName;
            if(!name) return "";
            return name.trim().split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
        })

        let avatarSrc = computed(()=>{
            if(!user.value || !user.value.avatarUrl) return null;
            return process.env.VUE_APP_API_URL + user.value.avatarUrl;
        })

        let goToProfile = ()=>{
            router.push({name:"Profile"})
        }

        let logout= async()=>{
        await signoutted();
        }
        return {logout,user,initials,avatarSrc,goToProfile,unreadTotal}
    }

}
</script>

<style scoped>
nav {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    border-radius: 10px;
    padding: 4px;
}

.user-info:hover {
    background: var(--color-primary-light);
}

.avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--color-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    object-fit: cover;
}

.display-name {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
    text-align: left;
}

.email {
    margin: 0;
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: left;
}

.nav-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}

.nav-link {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
}

.nav-link:hover,
.nav-link.router-link-active {
    color: var(--color-primary);
}

.messages-link {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.messages-link .badge {
    position: absolute;
    top: -8px;
    right: -12px;
    background: #e23636;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 5px;
    line-height: 1.4;
}

.logout-btn {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    box-shadow: none;
}

.logout-btn:hover {
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    transform: none;
}

@media (max-width: 600px) {
    nav {
        padding: 12px 14px;
    }

    .display-name,
    .email {
        max-width: 38vw;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .nav-actions {
        gap: 10px;
    }

    .nav-link {
        font-size: 13px;
    }

    .logout-btn {
        padding: 6px 12px;
        font-size: 13px;
    }
}
</style>