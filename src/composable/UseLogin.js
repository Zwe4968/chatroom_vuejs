import { ref } from "vue";
import { auth } from "../firebase/config";
let error = ref("");
let usersignin=async(email,password)=>{
    try{
        let res = await auth.signInWithEmailAndPassword(email,password)
        if(!res){
            throw new Error ("can't login account")
        }
       return res;
    }catch(err){
        console.error("Firebase Auth Error:", err.code, err.message);

        if (err.code === "auth/user-not-found") {
            error.value = "No account found with this email.";
        } else if (err.code === "auth/wrong-password") {
            error.value = "Incorrect password. Please try again.";
        } else if (err.code === "auth/invalid-email") {
            error.value = "Invalid email format.";
        } else {
            error.value = "Login failed. Please check your credentials.";
        }

        return null; 
    }
   
}
let userlogin=()=>{
    return {error,usersignin}
}
export{userlogin}