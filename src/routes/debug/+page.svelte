<script lang="ts">
    if ("credentials" in navigator) {
        navigator.credentials.get({ password: true }).then((creds) => {
            console.log(creds);
        });
    } else {
        // Handle sign-in the way you did before.
    }
</script>

Page