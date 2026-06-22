<template>
  <div class="container profile-container">
    <div class="back-link">
      <span class="link" @click="goBack">&larr; Back to chat</span>
    </div>

    <h1 class="profile-title">Profile</h1>

    <div class="avatar-section">
      <img v-if="avatarSrc" :src="avatarSrc" class="avatar-preview" alt="Avatar">
      <div v-else class="avatar-preview avatar-placeholder">{{ initials }}</div>
      <div>
        <p class="display-name">{{ user && user.displayName }}</p>
        <p class="email">{{ user && user.email }}</p>
      </div>
    </div>

    <section class="profile-section">
      <h2>Display name</h2>
      <form @submit.prevent="submitDisplayName">
        <input type="text" v-model="displayNameInput" required>
        <div class="error" v-if="displayNameError">{{ displayNameError }}</div>
        <button class="submit-btn">Save name</button>
      </form>
    </section>

    <section class="profile-section">
      <h2>Change password</h2>
      <form @submit.prevent="submitPassword">
        <input type="password" placeholder="Current password" v-model="currentPasswordInput" required>
        <input type="password" placeholder="New password" v-model="newPasswordInput" required>
        <div class="error" v-if="passwordError">{{ passwordError }}</div>
        <div class="success" v-if="passwordSuccess">Password changed.</div>
        <button class="submit-btn">Change password</button>
      </form>
    </section>

    <section class="profile-section">
      <h2>Avatar</h2>
      <form @submit.prevent="submitAvatar">
        <input type="file" accept="image/png,image/jpeg,image/webp" @change="onFileChange">
        <div class="error" v-if="avatarError">{{ avatarError }}</div>
        <button class="submit-btn" :disabled="!selectedFile">Upload avatar</button>
      </form>
    </section>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getUser } from '@/composable/Getuser';
import { useProfile } from '@/composable/UseProfile';

export default {
    setup(){
        let { user } = getUser();
        let router = useRouter();

        watch(user, (newUser)=>{
            if(!newUser){
                router.push({name:"Welcome"})
            }
        })

        let { displayNameError, passwordError, avatarError, updateDisplayName, changePassword, uploadAvatar } = useProfile();

        let displayNameInput = ref(user.value ? user.value.displayName : "");
        let currentPasswordInput = ref("");
        let newPasswordInput = ref("");
        let passwordSuccess = ref(false);
        let selectedFile = ref(null);

        let initials = computed(()=>{
            let name = user.value && user.value.displayName;
            if(!name) return "";
            return name.trim().split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase();
        })

        let avatarSrc = computed(()=>{
            if(!user.value || !user.value.avatarUrl) return null;
            return process.env.VUE_APP_API_URL + user.value.avatarUrl;
        })

        let goBack = ()=>{
            router.push({name:"Chatroom"})
        }

        let submitDisplayName = async ()=>{
            await updateDisplayName(displayNameInput.value);
        }

        let submitPassword = async ()=>{
            passwordSuccess.value = false;
            let ok = await changePassword(currentPasswordInput.value, newPasswordInput.value);
            if(ok){
                passwordSuccess.value = true;
                currentPasswordInput.value = "";
                newPasswordInput.value = "";
            }
        }

        let onFileChange = (event)=>{
            selectedFile.value = event.target.files[0] || null;
        }

        let submitAvatar = async ()=>{
            if(!selectedFile.value) return;
            await uploadAvatar(selectedFile.value);
        }

        return {
            user, initials, avatarSrc, goBack,
            displayNameInput, displayNameError, submitDisplayName,
            currentPasswordInput, newPasswordInput, passwordError, passwordSuccess, submitPassword,
            selectedFile, avatarError, onFileChange, submitAvatar,
        }
    }
}
</script>

<style scoped>
.profile-container {
    margin: 4% auto;
}

.back-link {
    margin-bottom: 16px;
}

.link {
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
}

.link:hover {
    text-decoration: underline;
}

.profile-title {
    margin-top: 0;
}

.avatar-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--color-border);
}

.avatar-preview {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.avatar-placeholder {
    background: var(--color-primary);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 20px;
}

.display-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
}

.email {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted);
}

.profile-section {
    margin-bottom: 28px;
}

.profile-section h2 {
    font-size: 15px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
}

.profile-section form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 360px;
}

.profile-section input {
    padding: 12px 16px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.profile-section input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.submit-btn {
    align-self: flex-start;
}

.submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.success {
    color: #16a34a;
    font-weight: 600;
    font-size: 14px;
    margin: 8px 0;
}
</style>
