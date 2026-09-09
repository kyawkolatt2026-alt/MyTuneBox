
let currentUser = null;


/* =========================
   ELEMENTS
========================= */

const authScreen =
    document.getElementById("authScreen");

const appScreen =
    document.getElementById("appScreen");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const authMessage =
    document.getElementById("authMessage");


/* =========================
   AUTH MESSAGE
========================= */

function showMessage(message, success = false) {

    authMessage.textContent = message;

    authMessage.style.color =
        success
            ? "#86efac"
            : "#fca5a5";
}


/* =========================
   SHOW LOGIN
========================= */

document
    .getElementById("showLogin")
    .addEventListener("click", () => {

        registerForm.classList.add("hidden");

        loginForm.classList.remove("hidden");

        showMessage("");
    });


/* =========================
   SHOW REGISTER
========================= */

document
    .getElementById("showRegister")
    .addEventListener("click", () => {

        loginForm.classList.add("hidden");

        registerForm.classList.remove("hidden");

        showMessage("");
    });


/* =========================
   REGISTER
========================= */

document
    .getElementById("registerBtn")
    .addEventListener("click", async () => {

        const name =
            document
                .getElementById("registerName")
                .value
                .trim();

        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("registerPassword")
                .value;

        const password2 =
            document
                .getElementById("registerPassword2")
                .value;


        if (!name || !email || !password) {

            showMessage(
                "Please fill in all fields."
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "Password must be at least 6 characters."
            );

            return;
        }


        if (password !== password2) {

            showMessage(
                "Passwords do not match."
            );

            return;
        }


        showMessage(
            "Creating your account...",
            true
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        display_name: name
                    }

                }

            });


        if (error) {

            showMessage(
                error.message
            );

            return;
        }


        showMessage(
            "Account created successfully. You can now login.",
            true
        );


        document
            .getElementById("loginEmail")
            .value = email;


        loginForm.classList.remove("hidden");

        registerForm.classList.add("hidden");

    });


/* =========================
   LOGIN
========================= */

document
    .getElementById("loginBtn")
    .addEventListener("click", async () => {

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!email || !password) {

            showMessage(
                "Please enter email and password."
            );

            return;
        }


        showMessage(
            "Logging in...",
            true
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {

            showMessage(
                error.message
            );

            return;
        }


        currentUser =
            data.user;

        await showApp();

    });


/* =========================
   LOGOUT
========================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        currentUser = null;

        showAuth();

    });


/* =========================
   SHOW APP
========================= */

async function showApp() {

    authScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");


    let displayName =
        currentUser
            ?.user_metadata
            ?.display_name;


    if (!displayName) {

        displayName =
            currentUser?.email
            ?.split("@")[0]
            || "User";
    }


    document
        .getElementById("userName")
        .textContent = displayName;


    document
        .getElementById("welcomeName")
        .textContent = displayName;


    await loadVideoCount();

}


/* =========================
   SHOW AUTH
========================= */

function showAuth() {

    appScreen.classList.add("hidden");

    authScreen.classList.remove("hidden");

    loginForm.classList.remove("hidden");

    registerForm.classList.add("hidden");

    document
        .getElementById("loginPassword")
        .value = "";

    showMessage("");

}


/* =========================
   VIDEO COUNT
========================= */

async function loadVideoCount() {

    if (!currentUser) return;


    const {
        count,
        error
    } =
        await supabaseClient
            .from("videos")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (!error) {

        document
            .getElementById("videoCount")
            .textContent = count || 0;

    }

}


/* =========================
   AUTH STATE
========================= */

supabaseClient.auth
    .getSession()
    .then(({ data }) => {

        if (data.session) {

            currentUser =
                data.session.user;

            showApp();

        } else {

            showAuth();

        }

    });


supabaseClient.auth
    .onAuthStateChange(
        async (event, session) => {

            if (session) {

                currentUser =
                    session.user;

                await showApp();

            } else {

                currentUser = null;

                showAuth();

            }

        }
    );
