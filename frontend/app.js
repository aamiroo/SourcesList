(() => {
    "use strict";

    /* ---------------------------------------------------------
       Config — adjust to match your backend's routes
    --------------------------------------------------------- */

    const API = {
        options: "/api/options", // GET  -> { mirrors, releases, components, suites }
        generate: "/api/generate", // POST -> { content, filename }
        distroInfo: "/api/distro-info", // GET ?release=<value> -> { title, description|html, tags, logo }
    };

    /* ---------------------------------------------------------
       Theme
    --------------------------------------------------------- */

    const root = document.documentElement;
    const themeToggle = document.getElementById("theme-toggle");

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        localStorage.setItem("repo-gen-theme", theme);
    }

    const savedTheme = localStorage.getItem("repo-gen-theme");
    const systemPrefersLight =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;

    applyTheme(savedTheme || (systemPrefersLight ? "light" : "dark"));

    themeToggle.addEventListener("click", () => {
        const next =
            root.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(next);
    });

    /* ---------------------------------------------------------
       Elements
    --------------------------------------------------------- */

    const mirrorSelect = document.getElementById("mirror");
    const mirrorCustom = document.getElementById("mirror-custom");
    const releaseSelect = document.getElementById("release");
    const componentsBox = document.getElementById("components");
    const suitesBox = document.getElementById("suites");
    const formatSelect = document.getElementById("format");
    const generateBtn = document.getElementById("generate");
    const output = document.getElementById("output");
    const copyBtn = document.getElementById("copy");
    const downloadBtn = document.getElementById("download");

    const distroInfo = document.getElementById("distro-info");
    const distroAvatar = document.getElementById("distro-avatar");
    const distroTitle = document.getElementById("distro-title");
    const distroDesc = document.getElementById("distro-desc");
    const distroTags = document.getElementById("distro-tags");

    let lastFilename = "sources.list";

    /* ---------------------------------------------------------
       Render helpers
    --------------------------------------------------------- */

    function fillSelect(select, items = []) {
        select.innerHTML = items
            .map((item) => `<option value="${item.value}">${item.label}</option>`)
            .join("");
    }

    function fillCheckboxGroup(container, items = [], name) {
        container.innerHTML = items
            .map(
                (item) => `
                <label>
                    <input
                        type="checkbox"
                        name="${name}"
                        value="${item.value}"
                        ${item.checked ? "checked" : ""}
                    >
                    ${item.label}
                </label>`
            )
            .join("");
    }

    function getChecked(container) {
        return Array.from(
            container.querySelectorAll("input[type=checkbox]:checked")
        ).map((el) => el.value);
    }

    function setOutput(text) {
        output.textContent = text;
        output.classList.remove("flash");
        void output.offsetWidth;
        output.classList.add("flash");
    }

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        generateBtn.classList.toggle("loading", isLoading);
        generateBtn.textContent = isLoading ? "Generating…" : "Generate";
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    /* ---------------------------------------------------------
       Distro info panel
    --------------------------------------------------------- */

    function skeletonHTML(lines) {
        return Array.from({ length: lines })
            .map((_, i) => `<div class="skeleton-line" style="width:${92 - i * 16}%"></div>`)
            .join("");
    }

    function revealDistroPanel() {
        if (!distroInfo.classList.contains("hidden")) return;
        distroInfo.classList.remove("hidden");
        // Double rAF so the browser commits the display change before animating in.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => distroInfo.classList.add("show"));
        });
    }

    function flashDistroPanel() {
        distroInfo.classList.remove("flash");
        void distroInfo.offsetWidth;
        distroInfo.classList.add("flash");
    }

    function renderDistroInfo(data, fallbackTitle) {
        const title = (data && data.title) || fallbackTitle;
        distroTitle.textContent = title;

        if (data && data.logo) {
            distroAvatar.innerHTML = `<img src="${data.logo}" alt="">`;
        } else {
            distroAvatar.textContent = (title || "?").charAt(0).toUpperCase();
        }

        if (data && data.html) {
            distroDesc.innerHTML = data.html;
        } else if (data && data.description) {
            const paragraphs = data.description.split(/\n{2,}/).filter(Boolean);
            distroDesc.innerHTML = paragraphs
                .map((p) => `<p>${escapeHtml(p)}</p>`)
                .join("");
        } else {
            distroDesc.innerHTML =
                "<p>No additional details are available for this release yet.</p>";
        }

        distroTags.innerHTML = ((data && data.tags) || [])
            .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
            .join("");
    }

    async function loadDistroInfo(release) {
        if (!release) return;

        revealDistroPanel();
        distroTitle.textContent = "Loading…";
        distroAvatar.textContent = "…";
        distroDesc.innerHTML = skeletonHTML(3);
        distroTags.innerHTML = "";

        try {
            const res = await fetch(
                `${API.distroInfo}?release=${encodeURIComponent(release)}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            renderDistroInfo(data, release);
        } catch (err) {
            renderDistroInfo(null, release);
        }
        flashDistroPanel();
    }

    releaseSelect.addEventListener("change", () => {
        loadDistroInfo(releaseSelect.value);
    });

    /* ---------------------------------------------------------
       Load options from the backend
    --------------------------------------------------------- */

    async function loadOptions() {
        try {
            const res = await fetch(API.options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            fillSelect(mirrorSelect, data.mirrors);
            fillSelect(releaseSelect, data.releases);
            fillCheckboxGroup(componentsBox, data.components, "component");
            fillCheckboxGroup(suitesBox, data.suites, "suite");

            const hasCustomMirror = (data.mirrors || []).some(
                (m) => m.value === "custom"
            );
            mirrorCustom.classList.toggle(
                "hidden",
                !hasCustomMirror || mirrorSelect.value !== "custom"
            );

            if (releaseSelect.value) {
                loadDistroInfo(releaseSelect.value);
            }
        } catch (err) {
            setOutput(
                `# Could not load options from ${API.options}\n# ${err.message}`
            );
        }
    }

    mirrorSelect.addEventListener("change", () => {
        const isCustom = mirrorSelect.value === "custom";
        mirrorCustom.classList.toggle("hidden", !isCustom);
        if (isCustom) mirrorCustom.focus();
    });

    /* ---------------------------------------------------------
       Generate — delegates entirely to the backend
    --------------------------------------------------------- */

    async function generate() {
        const payload = {
            mirror:
                mirrorSelect.value === "custom"
                    ? mirrorCustom.value.trim()
                    : mirrorSelect.value,
            release: releaseSelect.value,
            components: getChecked(componentsBox),
            suites: getChecked(suitesBox),
            format: formatSelect.value,
        };

        if (!payload.mirror) {
            setOutput("# Enter a mirror host to continue.");
            return;
        }
        if (!payload.components.length) {
            setOutput("# Select at least one component.");
            return;
        }
        if (!payload.suites.length) {
            setOutput("# Select at least one suite.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(API.generate, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            setOutput(data.content || "");
            lastFilename = data.filename || payload.format;
        } catch (err) {
            setOutput(`# Request to ${API.generate} failed\n# ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    generateBtn.addEventListener("click", generate);

    /* ---------------------------------------------------------
       Copy / Download
    --------------------------------------------------------- */

    function flashSuccess(button, label) {
        const original = button.innerHTML;
        button.textContent = label;
        button.classList.add("success");
        setTimeout(() => {
            button.innerHTML = original;
            button.classList.remove("success");
        }, 1400);
    }

    copyBtn.addEventListener("click", async () => {
        if (!output.textContent.trim()) return;
        try {
            await navigator.clipboard.writeText(output.textContent);
            flashSuccess(copyBtn, "Copied!");
        } catch {
            const range = document.createRange();
            range.selectNode(output);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    });

    downloadBtn.addEventListener("click", () => {
        if (!output.textContent.trim()) return;
        const blob = new Blob([output.textContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = lastFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        flashSuccess(downloadBtn, "Saved!");
    });

    /* ---------------------------------------------------------
       Init
    --------------------------------------------------------- */

    loadOptions();
})();
