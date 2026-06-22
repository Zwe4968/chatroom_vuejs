import { ref } from "vue"
import api from "@/api/config";
import { setUser } from "@/composable/Getuser";
import { connectSocket } from "@/socket";

let error = ref(null)
let useSignup = () => {
    let createAccount = async (email, password, displayname) => {
        try {
            let res = await api.post("/api/auth/signup", { email, password, displayName: displayname });
            localStorage.setItem("token", res.data.token);
            setUser(res.data.user);
            connectSocket();
            error.value = null;
            return res.data;
        } catch (err) {
            let code = err.response && err.response.data && err.response.data.code;

            if (code === "EMAIL_IN_USE") {
                error.value = "An account with this email already exists.";
            } else if (code === "INVALID_EMAIL") {
                error.value = "Invalid email format.";
            } else {
                error.value = "Could not create account. Please try again.";
            }

            return null;
        }
    }
    return { error, createAccount }
}

export { useSignup }
