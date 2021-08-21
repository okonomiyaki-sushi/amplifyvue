import { createRouter, createWebHistory } from 'vue-router'

import store from "@/store/index.js";
import Auth from "@aws-amplify/auth";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";

import SignIn from "../views/SignIn.vue";
import Index from "../views/Index.vue";

const routes = [
  {
    path: "/",
    redirect: { name: "Index" },
  },
  {
    path: "/signin",
    name: "SignIn",
    component: SignIn
  },
  {
    path: "/index",
    name: "Index",
    component: Index,
    meta: { requireAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

function getAuthenticatedUser() {
  return Auth.currentAuthenticatedUser()
    .then((data) => {
      if (data && data.signInUserSession) {
        store.commit("setUser", data);
        return data;
      }
    })
    .catch((e) => {
      console.error(e);
      store.commit("setUser", null);
      return null;
    });
}

let user;


router.beforeResolve(async (to, from, next) => {
  user = await getAuthenticatedUser();

  if (to.name === "SignIn" && user) {
    return next({ name: "Index" });
  }
  
  if (to.matched.some((record) => record.meta.requireAuth) && !user) {
    return next({ name: "SignIn" });
  }

  return next();
});

onAuthUIStateChange((authState, authData) => {
  if (authState === AuthState.SignedIn && authData) {
    router.push({ name: "Index" });
  }
  if (authState === AuthState.SignedOut) {
    router.push({ name: "SignIn" });
  }
});

export default router
