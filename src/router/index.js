
import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../views/Welcome.vue'
import Chatroom from '@/views/Chatroom.vue'
import Profile from '@/views/Profile.vue'
import Projects from '@/views/Projects.vue'
import ProjectBoard from '@/views/ProjectBoard.vue'
import Messages from '@/views/Messages.vue'
import { getUser } from '@/composable/Getuser'

const routes = [
{
  path:"/",
  name:"Welcome",
  component:Welcome,
  props:true,
  beforeEnter(to,from,next){
    let {user} = getUser();
    if(!user.value){
     next()
    }else{
     next({name:"Chatroom"})
    }
 }
},
{
  path:"/chatroom",
  name:"Chatroom",
  component:Chatroom,
  props:true,
  beforeEnter(to,from,next){
     let {user} = getUser();
     if(user.value){
      next()
     }else{
      next({name:"Welcome"})
     }
  }
},
{
  path:"/profile",
  name:"Profile",
  component:Profile,
  props:true,
  beforeEnter(to,from,next){
     let {user} = getUser();
     if(user.value){
      next()
     }else{
      next({name:"Welcome"})
     }
  }
},
{
  path:"/projects",
  name:"Projects",
  component:Projects,
  props:true,
  beforeEnter(to,from,next){
     let {user} = getUser();
     if(user.value){
      next()
     }else{
      next({name:"Welcome"})
     }
  }
},
{
  path:"/projects/:projectId",
  name:"ProjectBoard",
  component:ProjectBoard,
  props:true,
  beforeEnter(to,from,next){
     let {user} = getUser();
     if(user.value){
      next()
     }else{
      next({name:"Welcome"})
     }
  }
},
{
  path:"/messages",
  name:"Messages",
  component:Messages,
  props:true,
  beforeEnter(to,from,next){
     let {user} = getUser();
     if(user.value){
      next()
     }else{
      next({name:"Welcome"})
     }
  }
}
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
