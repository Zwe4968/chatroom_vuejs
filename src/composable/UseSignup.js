import { ref } from "vue"
import { auth } from '@/firebase/config';
let error = ref(null)
let useSignup=()=>{
let createAccount = async (email,password,displayname)=>{
    try{
        let res = await auth.createUserWithEmailAndPassword(email,password);
        if(!res){
            throw new Error("could not create new user")
        }
        res.user.updateProfile({displayName:displayname})
        return res
    
    }catch(err){
         error.value = err.message
    }   
}
    return {error,createAccount}
}

export {useSignup}