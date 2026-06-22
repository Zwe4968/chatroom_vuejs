import api from "@/api/config";
import { connectSocket } from "@/socket";
import { ref } from "vue";

let user = ref(null);

function setUser(_user) {
    user.value = _user;
}

async function restoreSession() {
    let token = localStorage.getItem("token");
    if (!token) {
        return;
    }
    try {
        let res = await api.get("/api/auth/me");
        user.value = res.data.user;
        connectSocket();
    } catch (err) {
        localStorage.removeItem("token");
        user.value = null;
    }
}

let getUser = () => {
    return { user };
};

export { getUser, setUser, restoreSession };
