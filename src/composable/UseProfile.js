import { ref } from "vue";
import api from "@/api/config";
import { setUser } from "@/composable/Getuser";
import { connectSocket, disconnectSocket } from "@/socket";

let displayNameError = ref("");
let passwordError = ref("");
let avatarError = ref("");

function applyAuthResponse(data) {
    localStorage.setItem("token", data.token);
    setUser(data.user);
    disconnectSocket();
    connectSocket();
}

let updateDisplayName = async (displayName) => {
    try {
        let res = await api.put("/api/auth/me", { displayName });
        applyAuthResponse(res.data);
        displayNameError.value = "";
        return res.data;
    } catch (err) {
        let code = err.response && err.response.data && err.response.data.code;
        if (code === "INVALID_DISPLAY_NAME") {
            displayNameError.value = err.response.data.message;
        } else {
            displayNameError.value = "Could not update display name. Please try again.";
        }
        return null;
    }
};

let changePassword = async (currentPassword, newPassword) => {
    try {
        await api.put("/api/auth/me/password", { currentPassword, newPassword });
        passwordError.value = "";
        return true;
    } catch (err) {
        let code = err.response && err.response.data && err.response.data.code;
        if (code === "WRONG_PASSWORD") {
            passwordError.value = "Incorrect current password. Please try again.";
        } else if (code === "WEAK_PASSWORD") {
            passwordError.value = "New password must be at least 6 characters.";
        } else {
            passwordError.value = "Could not change password. Please try again.";
        }
        return false;
    }
};

let uploadAvatar = async (file) => {
    try {
        let formData = new FormData();
        formData.append("avatar", file);
        let res = await api.post("/api/auth/me/avatar", formData);
        applyAuthResponse(res.data);
        avatarError.value = "";
        return res.data;
    } catch (err) {
        let code = err.response && err.response.data && err.response.data.code;
        if (code === "FILE_TOO_LARGE") {
            avatarError.value = "Image must be 2MB or smaller.";
        } else if (code === "INVALID_FILE_TYPE") {
            avatarError.value = "Only PNG, JPEG, or WEBP images are allowed.";
        } else if (code === "NO_FILE") {
            avatarError.value = "Please choose an image first.";
        } else {
            avatarError.value = "Could not upload avatar. Please try again.";
        }
        return null;
    }
};

let useProfile = () => {
    return { displayNameError, passwordError, avatarError, updateDisplayName, changePassword, uploadAvatar };
};

export { useProfile };
