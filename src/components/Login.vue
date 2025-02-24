<template>
    <h1 style="text-align: center;">Login</h1>
<form @submit.prevent="login">
<label>Email</label> <br>
<input type="email" placeholder="example.com" required v-model="email"> <br>
<label>Password</label> <br>
<input type="password" required v-model="password"><br>
<div class="error" v-if="error">
    {{ error }}
</div>
<button>Login</button>
</form>
</template>

<script>
import { ref } from 'vue';
import { userlogin } from '@/composable/UseLogin';
export default {
    setup(props,context){
        let email = ref("")
        let password = ref ("")
        let {error,usersignin} = userlogin();
        let login=async()=>{
          
         let res = await usersignin(email.value,password.value)
            if(res){
                context.emit("EnterChatRoom")
            }
        }

        return {email,password,login,error}
    }
}
</script>

<style>

</style>