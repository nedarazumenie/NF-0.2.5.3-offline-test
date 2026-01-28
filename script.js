document.addEventListener("DOMContentLoaded", () => {
    checkPrivacyAccepted();
    loadTheme();

    // Привязки (с проверками)
    const acceptBtn = document.getElementById("accept-privacy");
    if (acceptBtn) acceptBtn.addEventListener("click", acceptPrivacy);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

    const createThreadBtn = document.getElementById("create-thread-btn");
    if (createThreadBtn) createThreadBtn.addEventListener("click", createThread);

    const addPostBtn = document.getElementById("add-post-btn");
    if (addPostBtn) addPostBtn.addEventListener("click", addPost);

    const createPlusBtn = document.getElementById("create-plus-btn");
    if (createPlusBtn) createPlusBtn.addEventListener("click", createThreadViaPlus);

    // Интересы (категории)
    document.querySelectorAll('#interests-nav [data-interest]').forEach(btn => {
        btn.addEventListener('click', () => loadThreads(btn.dataset.interest));
    });
});

function acceptPrivacy() {
    try {
        localStorage.setItem("privacyAccepted", "true");
    } catch (e) { /* localStorage может быть недоступен */ }
    const overlay = document.getElementById("privacy-overlay");
    if (overlay) overlay.style.display = "none";
}

function checkPrivacyAccepted() {
    const overlay = document.getElementById("privacy-overlay");
    try {
        if (!localStorage.getItem("privacyAccepted")) {
            if (overlay) overlay.style.display = "flex";
        } else {
            if (overlay) overlay.style.display = "none";
        }
    } catch (e) {
        if (overlay) overlay.style.display = "flex";
    }
}

function loadTheme() {
    let theme = "dark";
    try {
        theme = localStorage.getItem("theme") || "dark";
    } catch (e) { theme = "dark"; }
    document.body.classList.toggle("dark-theme", theme === "dark");
}

function toggleTheme() {
    try {
        const theme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
        localStorage.setItem("theme", theme);
    } catch (e) { /* ignore */ }
    loadTheme();
}

// --- LocalStorage key helpers (scope)
function threadsKey(interest) {
    return `threads:${encodeURIComponent(interest)}`;
}
function postsKey(interest, thread) {
    return `posts:${encodeURIComponent(interest)}:${encodeURIComponent(thread)}`;
}

// Состояние
let currentInterest = "";
let currentThread = "";

// Создаёт элемент треда с обработчиком открытия
function makeThreadElement(title) {
    const li = document.createElement("li");
    li.textContent = title;
    li.tabIndex = 0;
    li.addEventListener("click", () => openThread(title));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") openThread(title); });
    return li;
}

// Загрузка тредов (обновляем main и sidebar)
function loadThreads(interest) {
    currentInterest = interest;
    const currentInterestEl = document.getElementById("current-interest");
    if (currentInterestEl) currentInterestEl.textContent = "Треды в разделе: " + interest;

    const threadList = document.getElementById("thread-list");
    const sidebarList = document.getElementById("sidebar-thread-list");
    if (threadList) threadList.innerHTML = "";
    if (sidebarList) sidebarList.innerHTML = "";

    let threads = [];
    try {
        threads = JSON.parse(localStorage.getItem(threadsKey(interest)) || "[]");
    } catch (e) {
        threads = [];
    }

    threads.forEach(thread => {
        if (threadList) threadList.appendChild(makeThreadElement(thread));
        if (sidebarList) sidebarList.appendChild(makeThreadElement(thread));
    });

    // Сброс состояния постов при смене раздела
    const postSection = document.getElementById("post-section");
    if (postSection) postSection.style.display = "none";
    currentThread = "";

    // Скрыть плюс (появляетcя при выборе треда)
    setCreatePlusVisible(false);

    // Обновить подсветку
    highlightActiveThread();
}

// Создание треда через поле ввода
function createThread() {
    const titleInput = document.getElementById("thread-title");
    const title = titleInput ? titleInput.value.trim() : "";

    if (!currentInterest) return alert("Сначала выберите интерес (раздел).");
    if (!title) return alert("Введите название треда!");

    let threads = [];
    try {
        threads = JSON.parse(localStorage.getItem(threadsKey(currentInterest)) || "[]");
    } catch (e) { threads = []; }

    if (threads.includes(title)) return alert("Тред с таким названием уже существует в этом разделе.");

    threads.push(title);
    try { localStorage.setItem(threadsKey(currentInterest), JSON.stringify(threads)); } catch (e) {}
    if (titleInput) titleInput.value = "";
    loadThreads(currentInterest);
    openThread(title);
}

// Создание треда через плюс-иконку
function createThreadViaPlus() {
    if (!currentInterest) return alert("Сначала выберите интерес (раздел).");
    const title = prompt("Название нового треда:");
    if (!title || !title.trim()) return;
    const cleanTitle = title.trim();

    let threads = [];
    try { threads = JSON.parse(localStorage.getItem(threadsKey(currentInterest)) || "[]"); } catch (e) { threads = []; }
    if (threads.includes(cleanTitle)) return alert("Тред с таким названием уже существует.");
    threads.push(cleanTitle);
    try { localStorage.setItem(threadsKey(currentInterest), JSON.stringify(threads)); } catch (e) {}
    loadThreads(currentInterest);
    openThread(cleanTitle);
}

// Открытие треда
function openThread(thread) {
    currentThread = thread;
    const titleEl = document.getElementById("thread-title-display");
    if (titleEl) titleEl.textContent = "Тред: " + thread;
    const postSection = document.getElementById("post-section");
    if (postSection) postSection.style.display = "block";

    loadPosts();

    // показать плюс
    setCreatePlusVisible(true);

    // подсветить в sidebar и main списке
    highlightActiveThread();
}

function setCreatePlusVisible(visible) {
    const cp = document.getElementById("create-plus");
    if (!cp) return;
    cp.setAttribute("aria-hidden", visible ? "false" : "true");
    cp.style.display = visible ? "flex" : "none";
}

function highlightActiveThread() {
    const sidebarList = document.getElementById("sidebar-thread-list");
    if (sidebarList) {
        Array.from(sidebarList.children).forEach(li => {
            if (li.textContent === currentThread) li.classList.add("active-thread");
            else li.classList.remove("active-thread");
        });
    }
    const threadList = document.getElementById("thread-list");
    if (threadList) {
        Array.from(threadList.children).forEach(li => {
            if (li.textContent === currentThread) li.classList.add("active-thread");
            else li.classList.remove("active-thread");
        });
    }
}

// Добавление поста
function addPost() {
    const contentEl = document.getElementById("post-content");
    const content = contentEl ? contentEl.value.trim() : "";
    const mediaInput = document.getElementById("media-input");
    const media = mediaInput && mediaInput.files ? mediaInput.files[0] : null;

    if (!content && !media) return alert("Введите сообщение или прикрепите изображение!");
    if (!currentInterest || !currentThread) return alert("Откройте тред, прежде чем добавлять пост.");

    const key = postsKey(currentInterest, currentThread);
    let posts = [];
    try { posts = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { posts = []; }

    let post = { text: content, time: new Date().toLocaleString(), replies: [] };

    if (media) {
        const reader = new FileReader();
        reader.onload = function (event) {
            post.image = event.target.result;
            posts.push(post);
            try { localStorage.setItem(key, JSON.stringify(posts)); } catch (e) {}
            if (contentEl) contentEl.value = "";
            if (mediaInput) mediaInput.value = "";
            loadPosts();
        };
        reader.readAsDataURL(media);
    } else {
        posts.push(post);
        try { localStorage.setItem(key, JSON.stringify(posts)); } catch (e) {}
        if (contentEl) contentEl.value = "";
        if (mediaInput) mediaInput.value = "";
        loadPosts();
    }
}

// Ответ на пост
function replyToPost(index) {
    if (!currentInterest || !currentThread) return alert("Откройте тред для ответов.");
    const key = postsKey(currentInterest, currentThread);
    let posts = [];
    try { posts = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { posts = []; }

    if (!posts[index]) return alert("Пост не найден.");

    const replyText = prompt("Введите ответ:");
    if (!replyText) return;

    posts[index].replies = posts[index].replies || [];
    posts[index].replies.push({ text: replyText, time: new Date().toLocaleString() });

    try { localStorage.setItem(key, JSON.stringify(posts)); } catch (e) {}
    loadPosts();
}

// Загрузка постов
function loadPosts() {
    const postList = document.getElementById("post-list");
    if (!postList) return;
    postList.innerHTML = "";

    if (!currentInterest || !currentThread) return;

    let posts = [];
    try { posts = JSON.parse(localStorage.getItem(postsKey(currentInterest, currentThread)) || "[]"); } catch (e) { posts = []; }

    posts.forEach((post, index) => {
        const li = document.createElement("li");
        li.className = "post-item";

        const p = document.createElement("p");
        p.textContent = post.text || "";
        li.appendChild(p);

        const time = document.createElement("small");
        time.textContent = post.time || "";
        li.appendChild(time);

        if (post.image) {
            const img = document.createElement("img");
            img.src = post.image;
            img.alt = "Image";
            li.appendChild(img);
        }

        const replyBtn = document.createElement("button");
        replyBtn.textContent = "Ответить";
        replyBtn.addEventListener("click", () => replyToPost(index));
        li.appendChild(replyBtn);

        if (post.replies && post.replies.length) {
            const repliesUl = document.createElement("ul");
            repliesUl.className = "replies-list";
            post.replies.forEach(reply => {
                const rli = document.createElement("li");
                const rp = document.createElement("p");
                rp.textContent = reply.text;
                const rtime = document.createElement("small");
                rtime.textContent = reply.time;
                rli.appendChild(rp);
                rli.appendChild(rtime);
                repliesUl.appendChild(rli);
            });
            li.appendChild(repliesUl);
        }

        postList.appendChild(li);
    });
}
