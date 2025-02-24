import { db } from "@/firebase/config"
import { ref } from "vue"
let usecollection=( collection )=>{
    let error = ref(null)
    let addDoc = async(doc)=>{
        try {
          await db.collection(collection).add(doc)
        } catch (error) {
            console.log(error.message);
            error.value="could not send message"
        }
    }
    return {error,addDoc}
}

export {usecollection}