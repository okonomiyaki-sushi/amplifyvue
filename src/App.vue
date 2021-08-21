<template>
  <div v-if="isSignedIn">
    <amplify-greetings></amplify-greetings>
  </div>
  <router-view/>
</template>

<script>
export default {
  computed: {
    isSignedIn() {
      return this.$store.state.user !== null;
    },
  },
};
</script>