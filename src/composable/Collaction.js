import { getSocket } from "@/socket"
import { ref } from "vue"
let usecollection = (collection) => {
    let error = ref(null)
    let addDoc = async (doc) => {
        try {
            getSocket().emit("message:send", doc)
        } catch (error) {
            console.log(error.message);
            error.value = "could not send message"
        }
    }
    return { error, addDoc }
}

export { usecollection }
