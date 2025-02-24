<template>
  <nav v-if="user">
    <div>
        <p>{{ user.displayName }}</p>
        <p class="email">login as {{ user.email }}</p>
    </div>
    <button @click="logout"> Logout</button>
  </nav>
</template>

<script>
import { usersignout } from '@/composable/Userlogout';
import {getUser} from '@/composable/Getuser'
import { auth } from '@/firebase/config';
import { ref } from 'vue';

export default {
    
    setup(){
        let {user} = getUser();
        let {signoutted} = usersignout();

        
        let logout= async()=>{
        await signoutted();
        }
        return {logout,user}
    }
    
}
</script>

<style>
        nav{
            padding: 20px;
            border-bottom: 1px solid white;
            display: flex;
            justify-content: space-between;
            text-align: center;
        }
        nav p{
            margin: 1px auto;
            font-size: 16px;
            color: black;
        }
        nav p.email{
                font-size: 14px;
                color: gray
        }
</style>