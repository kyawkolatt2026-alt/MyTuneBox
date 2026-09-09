let currentUser = null;
let pendingVideo = null;

/* =========================
   ELEMENTS
========================= */

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const authMessage = document.getElementById("authMessage");
const videoMessage = document.getElementById("videoMessage");

const videoPreview = document.getElementById("videoPreview");
const videoGrid = document.getElementById("videoGrid");
const emptyLibrary = document.getElementById("emptyLibrary");


/* =========================
   MESSAGE
========================= */

function showAuthMessage(message, success = false) {
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.style.color = success ? "#86efac" : "#fca5a5";
}

function showVideoMessage(message, success = false) {
    if (!videoMessage) return;

    videoMessage.textContent = message;
    videoMessage.style.color = success ? "#86efac" : "#fca5a5";
}


/* =========================
   LOGIN / REGISTER SWITCH
========================= */

const showRegisterBtn = document.getElementById("showRegister");
const showLoginBtn = document.getElementById("showLogin");

if (showRegisterBtn) {
    showRegisterBtn.onclick = () => {
        loginForm?.classList.add("hidden");
        registerForm?.classList.remove("hidden");
        showAuthMessage("");
    };
}

if (showLoginBtn) {
    showLoginBtn.onclick = () => {
        registerForm?.classList.add("hidden");
        loginForm?.classList.remove("hidden");
        showAuthMessage("");
    };
}


/* =========================
   REGISTER
========================= */

const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
    registerBtn.onclick = async () => {

        try {

            const name =
                document.getElementById("registerName")?.value.trim();

            const email =
                document.getElementById("registerEmail")?.value.trim();

            const password =
                document.getElementById("registerPassword")?.value;

            const password2 =
                document.getElementById("registerPassword2")?.value;


            if (!name || !email || !password || !password2) {
                showAuthMessage("Please fill in all fields.");
                return;
            }


            if (password.length < 6) {
                showAuthMessage(
                    "Password must be at least 6 characters."
                );
                return;
            }


            if (password !== password2) {
                showAuthMessage("Passwords do not match.");
                return;
            }


            showAuthMessage(
                "Creating account...",
                true
            );


            const { data, error } =
                await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: name
                        }
                    }
                });


            if (error) {
                showAuthMessage(error.message);
                return;
            }


            showAuthMessage(
                "Account created successfully.",
                true
            );


            const loginEmail =
                document.getElementById("loginEmail");

            if (loginEmail) {
                loginEmail.value = email;
            }


            loginForm?.classList.remove("hidden");
            registerForm?.classList.add("hidden");

        } catch (error) {

            console.error(error);

            showAuthMessage(
                error?.message || "Registration failed."
            );
        }
    };
}


/* =========================
   LOGIN
========================= */

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
    loginBtn.onclick = async () => {

        try {

            const email =
                document.getElementById("loginEmail")?.value.trim();

            const password =
                document.getElementById("loginPassword")?.value;


            if (!email || !password) {
                showAuthMessage(
                    "Please enter email and password."
                );
                return;
            }


            showAuthMessage(
                "Logging in...",
                true
            );


            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });


            if (error) {
                showAuthMessage(error.message);
                return;
            }


            currentUser = data.user;

            await showApp();

        } catch (error) {

            console.error(error);

            showAuthMessage(
                error?.message || "Login failed."
            );
        }
    };
}


/* =========================
   LOGOUT
========================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.onclick = async () => {

        await supabaseClient.auth.signOut();

        currentUser = null;

        showAuth();
    };
}


/* =========================
   AUTH SCREEN
========================= */

function showAuth() {

    appScreen?.classList.add("hidden");
    authScreen?.classList.remove("hidden");
}


/* =========================
   APP SCREEN
========================= */

async function showApp() {

    authScreen?.classList.add("hidden");
    appScreen?.classList.remove("hidden");


    const name =
        currentUser?.user_metadata?.display_name ||
        currentUser?.email?.split("@")[0] ||
        "User";


    const userName =
        document.getElementById("userName");

    const welcomeName =
        document.getElementById("welcomeName");


    if (userName) {
        userName.textContent = name;
    }

    if (welcomeName) {
        welcomeName.textContent = name;
    }


    await loadVideos();
}


/* =========================
   YOUTUBE ID
========================= */

function getYoutubeId(url) {

    try {

        const parsed = new URL(url);

        const host =
            parsed.hostname
                .replace("www.", "")
                .toLowerCase();


        if (host === "youtu.be") {

            return parsed.pathname
                .replace("/", "")
                .split("/")[0];

        }


        if (
            host === "youtube.com" ||
            host === "m.youtube.com"
        ) {

            if (parsed.pathname === "/watch") {
                return parsed.searchParams.get("v");
            }


            if (parsed.pathname.startsWith("/shorts/")) {

                return parsed.pathname
                    .split("/")[2];

            }


            if (parsed.pathname.startsWith("/embed/")) {

                return parsed.pathname
                    .split("/")[2];

            }
        }

    } catch (error) {

        console.error(error);

        return null;
    }


    return null;
}


/* =========================
   YOUTUBE API
========================= */

async function fetchYoutubeVideo(youtubeId) {

    const url =
        "https://www.googleapis.com/youtube/v3/videos" +
        "?part=snippet" +
        "&id=" +
        encodeURIComponent(youtubeId) +
        "&key=" +
        encodeURIComponent(YOUTUBE_API_KEY);


    const response = await fetch(url);

    const data = await response.json();


    if (!response.ok || data.error) {

        throw new Error(
            data?.error?.message ||
            "YouTube API request failed."
        );
    }


    if (!data.items || data.items.length === 0) {

        throw new Error(
            "YouTube video not found."
        );
    }


    const snippet = data.items[0].snippet;


    return {
        youtubeId,

        title: snippet.title,

        channelName: snippet.channelTitle,

        description: snippet.description,

        thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url
    };
}


/* =========================
   FETCH BUTTON
========================= */

const fetchYoutubeBtn =
    document.getElementById("fetchYoutubeBtn");


if (fetchYoutubeBtn) {

    fetchYoutubeBtn.onclick = async () => {

        try {

            const input =
                document.getElementById("youtubeUrl");


            if (!input) {

                showVideoMessage(
                    "YouTube URL input not found."
                );

                return;
            }


            const youtubeUrl =
                input.value.trim();


            if (!youtubeUrl) {

                showVideoMessage(
                    "Please paste a YouTube URL."
                );

                return;
            }


            const youtubeId =
                getYoutubeId(youtubeUrl);


            if (!youtubeId) {

                showVideoMessage(
                    "Invalid YouTube URL."
                );

                return;
            }


            showVideoMessage(
                "Getting video information...",
                true
            );


            videoPreview?.classList.add("hidden");


            const video =
                await fetchYoutubeVideo(youtubeId);


            pendingVideo = {
                ...video,
                youtubeUrl
            };


            const previewThumbnail =
                document.getElementById("previewThumbnail");

            const previewTitle =
                document.getElementById("previewTitle");

            const previewChannel =
                document.getElementById("previewChannel");


            if (previewThumbnail) {
                previewThumbnail.src =
                    video.thumbnail;
            }


            if (previewTitle) {
                previewTitle.textContent =
                    video.title;
            }


            if (previewChannel) {
                previewChannel.textContent =
                    video.channelName;
            }


            videoPreview?.classList.remove(
                "hidden"
            );


            showVideoMessage(
                "Video found! You can save it now.",
                true
            );

        } catch (error) {

            console.error(
                "YouTube Fetch Error:",
                error
            );

            showVideoMessage(
                error?.message ||
                "Could not get YouTube video information."
            );
        }
    };
}


/* =========================
   SAVE VIDEO
========================= */

const saveVideoBtn =
    document.getElementById("saveVideoBtn");


if (saveVideoBtn) {

    saveVideoBtn.onclick = async () => {

        try {

            if (!currentUser) {

                showVideoMessage(
                    "Please login first."
                );

                return;
            }


            if (!pendingVideo) {

                showVideoMessage(
                    "Please fetch a YouTube video first."
                );

                return;
            }


            showVideoMessage(
                "Saving video...",
                true
            );


            const { error } =
                await supabaseClient
                    .from("videos")
                    .insert({
                        user_id: currentUser.id,

                        youtube_id:
                            pendingVideo.youtubeId,

                        youtube_url:
                            pendingVideo.youtubeUrl,

                        title:
                            pendingVideo.title,

                        channel_name:
                            pendingVideo.channelName,

                        thumbnail_url:
                            pendingVideo.thumbnail,

                        description:
                            pendingVideo.description
                    });


            if (error) {

                console.error(
                    "Save Video Error:",
                    error
                );


                if (error.code === "23505") {

                    showVideoMessage(
                        "This video is already in your library."
                    );

                } else {

                    showVideoMessage(
                        error.message
                    );
                }

                return;
            }


            showVideoMessage(
                "Video saved to your library!",
                true
            );


            const youtubeUrlInput =
                document.getElementById("youtubeUrl");


            if (youtubeUrlInput) {
                youtubeUrlInput.value = "";
            }


            videoPreview?.classList.add("hidden");

            pendingVideo = null;


            await loadVideos();

        } catch (error) {

            console.error(error);

            showVideoMessage(
                error?.message ||
                "Could not save video."
            );
        }
    };
}


/* =========================
   LOAD VIDEOS
========================= */

async function loadVideos() {

    if (!currentUser) return;


    const { data, error } =
        await supabaseClient
            .from("videos")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "Load Videos Error:",
            error
        );

        showVideoMessage(
            error.message
        );

        return;
    }


    renderVideos(data || []);
}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos(videos) {

    if (!videoGrid) return;


    videoGrid.innerHTML = "";


    const videoCount =
        document.getElementById("videoCount");


    if (videoCount) {
        videoCount.textContent =
            `${videos.length} Videos`;
    }


    if (videos.length === 0) {

        emptyLibrary?.classList.remove(
            "hidden"
        );

        return;
    }


    emptyLibrary?.classList.add(
        "hidden"
    );


    videos.forEach(video => {

        const card =
            document.createElement("div");


        card.className =
            "video-card";


        card.innerHTML = `

            <div class="thumbnail-box">

                <img
                    src="${escapeHtml(video.thumbnail_url)}"
                    alt="${escapeHtml(video.title)}"
                >

                <div class="play-overlay">

                    <button
                        class="play-button"
                        data-id="${escapeHtml(video.youtube_id)}"
                    >
                        ▶
                    </button>

                </div>

            </div>


            <div class="video-info">

                <h3>
                    ${escapeHtml(video.title)}
                </h3>

                <p>
                    ${escapeHtml(
                        video.channel_name || "YouTube"
                    )}
                </p>


                <div class="card-actions">

                    <button
                        class="watch-btn"
                        data-id="${escapeHtml(video.youtube_id)}"
                    >
                        ▶ Watch
                    </button>

                    <button
                        class="delete-btn"
                        data-video="${escapeHtml(video.id)}"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;


        videoGrid.appendChild(card);
    });


    document
        .querySelectorAll(".watch-btn")
        .forEach(button => {

            button.onclick = () => {

                openYoutube(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".play-button")
        .forEach(button => {

            button.onclick = () => {

                openYoutube(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.onclick = () => {

                deleteVideo(
                    button.dataset.video
                );

            };

        });
}


/* =========================
   OPEN YOUTUBE
========================= */

function openYoutube(id) {

    if (!id) return;


    const url =
        `https://www.youtube.com/watch?v=${id}`;


    window.open(
        url,
        "_blank"
    );
}


/* =========================
   DELETE
========================= */

async function deleteVideo(videoId) {

    const confirmed =
        confirm(
            "Delete this video from your library?"
        );


    if (!confirmed) return;


    const { error } =
        await supabaseClient
            .from("videos")
            .delete()
            .eq("id", videoId)
            .eq("user_id", currentUser.id);


    if (error) {

        alert(error.message);

        return;
    }


    await loadVideos();
}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   SESSION
========================= */

async function initializeApp() {

    try {

        const { data } =
            await supabaseClient.auth.getSession();


        if (data?.session) {

            currentUser =
                data.session.user;

            await showApp();

        } else {

            showAuth();
        }

    } catch (error) {

        console.error(
            "Session Error:",
            error
        );

        showAuth();
    }
}


supabaseClient.auth.onAuthStateChange(
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


initializeApp();
