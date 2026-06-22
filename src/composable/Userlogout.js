import api from "@/api/config";
import { setUser } from "@/composable/Getuser";
import { disconnectSocket } from "@/socket";

let signoutted = async () => {
    try {
        await api.post("/api/auth/logout");
    } catch (err) {
        // stateless JWT logout has nothing meaningful to recover from server-side
    }
    localStorage.removeItem("token");
    setUser(null);
    disconnectSocket();
}
let usersignout = () => {
    return { signoutted }
}
export { usersignout }
