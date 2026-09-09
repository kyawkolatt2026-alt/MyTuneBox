let currentUser = null;

let pendingVideo = null;


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

const videoMessage =
    document.getElementById("videoMessage");

const videoPreview =
    document.getElementById("videoPreview");

const videoGrid =
    document.getElementById("videoGrid");

const emptyLibrary =
    document.getElementById("emptyLibrary");


/* =========================
   MESSAGE
========================= */

function showAuthMessage(
    message,
    success = false
) {

    authMessage.textContent = message;

    authMessage.style.color =
        success
            ? "#86efac"
            : "#fca5a5";
}


function showVideoMessage(
    message,
    success = false
) {

    videoMessage.textContent = message;

    videoMessage.style.color =
        success
            ? "#86efac"
            : "#fca5a5";
}


/* =========================
   LOGIN / REGISTER SWITCH
========================= */

document
    .getElementById("showRegister")
    .onclick = () => {

        loginForm.classList.add("hidden");

        registerForm.classList.remove("hidden");

        showAuthMessage("");
    };


document
    .getElementById("showLogin")
    .onclick = () => {

        registerForm.classList.add("hidden");

        loginForm.classList.remove("hidden");

        showAuthMessage("");
    };


/* =========================
   REGISTER
========================= */

document
    .getElementById("registerBtn")
    .onclick = async () => {

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

            showAuthMessage(
                "Please fill in all fields."
            );

            return;
        }


        if (password.length < 6) {

            showAuthMessage(
                "Password must be at least 6 characters."
            );

            return;
        }


        if (password !== password2) {

            showAuthMessage(
                "Passwords do not match."
            );

            return;
        }


        showAuthMessage(
            "Creating account...",
            true
        );


        const {
            data,
            error
        } =
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

            showAuthMessage(
                error.message
            );

            return;
        }


        showAuthMessage(
            "Account created successfully.",
            true
        );


        document
            .getElementById("loginEmail")
            .value = email;


        loginForm.classList.remove("hidden");

        registerForm.classList.add("hidden");
    };


/* =========================
   LOGIN
========================= */

document
    .getElementById("loginBtn")
    .onclick = async () => {

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

            showAuthMessage(
                "Please enter email and password."
            );

            return;
        }


        showAuthMessage(
            "Logging in...",
            true
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email,

                    password

                });


        if (error) {

            showAuthMessage(
                error.message
            );

            return;
        }


        currentUser = data.user;

        await showApp();
    };


/* =========================
   LOGOUT
========================= */

document
    .getElementById("logoutBtn")
    .onclick = async () => {

        await supabaseClient.auth.signOut();

        currentUser = null;

        showAuth();
    };


/* =========================
   AUTH SCREEN
========================= */

function showAuth() {

    appScreen.classList.add("hidden");

    authScreen.classList.remove("hidden");
}


/* =========================
   APP SCREEN
========================= */

async function showApp() {

    authScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");


    const name =
        currentUser
            ?.user_metadata
            ?.display_name
        ||
        currentUser
            ?.email
            ?.split("@")[0]
        ||
        "User";


    document
        .getElementById("userName")
        .textContent = name;


    document
        .getElementById("welcomeName")
        .textContent = name;


    await loadVideos();
}


/* =========================
   YOUTUBE ID
========================= */

function getYoutubeId(url) {

    try {

        const parsed =
            new URL(url);

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

            if (
                parsed.pathname ===
                "/watch"
            ) {

                return parsed.searchParams
                    .get("v");
            }


            if (
                parsed.pathname
                    .startsWith("/shorts/")
            ) {

                return parsed.pathname
                    .split("/")[2];
            }


            if (
                parsed.pathname
                    .startsWith("/embed/")
            ) {

                return parsed.pathname
                    .split("/")[2];
            }
        }

    } catch (error) {

        return null;
    }


    return null;
}


/* =========================
   YOUTUBE API
========================= */

async function fetchYoutubeVideo(
    youtubeId
) {

    const url =
        "https://www.googleapis.com/youtube/v3/videos" +
        "?part=snippet" +
        "&id=" +
        encodeURIComponent(youtubeId) +
        "&key=" +
        encodeURIComponent(YOUTUBE_API_KEY);


    const response =
        await fetch(url);


    const data =
        await response.json();


    if (
        !response.ok ||
        data.error
    ) {

        throw new Error(
            data?.error?.message ||
            "YouTube API request failed."
        );
    }


    if (
        !data.items ||
        data.items.length === 0
    ) {

        throw new Error(
            "YouTube video not found."
        );
    }


    const snippet =
        data.items[0].snippet;


    return {

        youtubeId,

        title:
            snippet.title,

        channelName:
            snippet.channelTitle,

        description:
            snippet.description,

        thumbnail:
            snippet.thumbnails?.high?.url
            ||
            snippet.thumbnails?.medium?.url
            ||
            snippet.thumbnails?.default?.url

    };
}


/* =========================
   FETCH BUTTON
========================= */

document
    .getElementById("fetchYoutubeBtn")
    .onclick = async () => {

        const input =
            document
                .getElementById("youtubeUrl");

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


        videoPreview.classList.add(
            "hidden"
        );


        try {

            const video =
                await fetchYoutubeVideo(
                    youtubeId
                );


            pendingVideo = {

                ...video,

                youtubeUrl

            };


            document
                .getElementById(
                    "previewThumbnail"
                )
                .src =
                    video.thumbnail;


            document
                .getElementById(
                    "previewTitle"
                )
                .textContent =
                    video.title;


            document
                .getElementById(
                    "previewChannel"
                )
                .textContent =
                    video.channelName;


            videoPreview.classList.remove(
                "hidden"
            );


            showVideoMessage(
                "Video found!",
                true
            );

        } catch (error) {

            console.error(error);

            showVideoMessage(
                error.message
            );
        }
    };


/* =========================
   SAVE VIDEO
========================= */

document
    .getElementById("saveVideoBtn")
    .onclick = async () => {

        if (!currentUser) {

            showVideoMessage(
                "Please login first."
            );

            return;
        }


        if (!pendingVideo) {

            return;
        }


        showVideoMessage(
            "Saving video...",
            true
        );


        const {
            error
        } =
            await supabaseClient
                .from("videos")
                .insert({

                    user_id:
                        currentUser.id,

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

            if (
                error.code === "23505"
            ) {

                showVideoMessage(
                    "This video is already in your library."
                );

            } else {

                console.error(error);

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


        document
            .getElementById(
                "youtubeUrl"
            )
            .value = "";


        videoPreview.classList.add(
            "hidden"
        );


        pendingVideo = null;


        await loadVideos();
    };


/* =========================
   LOAD VIDEOS
========================= */

async function loadVideos() {

    if (!currentUser) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("videos")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        return;
    }


    renderVideos(data || []);
}


/* =========================
   RENDER VIDEOS
========================= */

function renderVideos(videos) {

    videoGrid.innerHTML = "";


    document
        .getElementById("videoCount")
        .textContent =
            `${videos.length} Videos`;


    if (videos.length === 0) {

        emptyLibrary.classList.remove(
            "hidden"
        );

        return;
    }


    emptyLibrary.classList.add(
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
                        data-id="${video.youtube_id}"
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
                        data-id="${video.youtube_id}"
                    >
                        ▶ Watch
                    </button>

                    <button
                        class="delete-btn"
                        data-video="${video.id}"
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

async function deleteVideo(
    videoId
) {

    const confirmed =
        confirm(
            "Delete this video from your library?"
        );


    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient
            .from("videos")
            .delete()
            .eq(
                "id",
                videoId
            )
            .eq(
                "user_id",
                currentUser.id
            );


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

supabaseClient.auth
    .getSession()
    .then(async ({ data }) => {

        if (data.session) {

            currentUser =
                data.session.user;

            await showApp();

        } else {

            showAuth();
        }

    });


supabaseClient.auth
    .onAuthStateChange(
        async (
            event,
            session
        ) => {

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
