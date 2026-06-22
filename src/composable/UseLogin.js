import { ref } from "vue";
import api from "@/api/config";
import { setUser } from "@/composable/Getuser";
import { connectSocket } from "@/socket";

let error = ref("");

let usersignin = async (email, password) => {
    try {
        let res = await api.post("/api/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        connectSocket();
        error.value = "";
        return res.data;
    } catch (err) {
        let code = err.response && err.response.data && err.response.data.code;

        if (code === "USER_NOT_FOUND") {
            error.value = "No account found with this email.";
        } else if (code === "WRONG_PASSWORD") {
            error.value = "Incorrect password. Please try again.";
        } else if (code === "INVALID_EMAIL") {
            error.value = "Invalid email format.";
        } else {
            error.value = "Login failed. Please check your credentials.";
        }

        return null;
    }
};

let userlogin = () => {
    return { error, usersignin };
};
export { userlogin };
