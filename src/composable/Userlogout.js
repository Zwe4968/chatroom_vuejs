import { auth } from "@/firebase/config";
import { ref } from "vue";


let signoutted = async()=>{
    let error = ref(null)
        try{
             await auth.signOut();
            console.log("user logged out");
       
        }catch(err){
            error.value=err.message
        }
    }
    let usersignout=()=>{  
    return {signoutted}
}
export {usersignout}