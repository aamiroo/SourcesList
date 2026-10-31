(() => {
    "use strict";

    // ==========================================
    // API
    // ==========================================

   const API = {
    baseURL: "/api",
    options: "/api/repository_data",
    generate: "/api/generator",
    paste: "/api/paste/",
};

    // ==========================================
    // DOM
    // ==========================================

    const $ = (selector) => document.querySelector(selector);

    const dom = {
        themeToggle: $("#theme-toggle"),

        generatorView: $("#generator-view"),
        pasteView: $("#paste-view"),

        mirror: $("#mirror"),
        mirrorCustom: $("#mirror-custom"),
        release: $("#release"),
        components: $("#components"),
        suites: $("#suites"),
        format: $("#format"),

        generate: $("#generate"),
        output: $("#output"),
        copy: $("#copy"),
        download: $("#download"),

        distroInfo: $("#distro-info"),
        distroAvatar: $("#distro-avatar"),
        distroTitle: $("#distro-title"),
        distroDesc: $("#distro-desc"),
        distroTags: $("#distro-tags"),

        outputFilename: $("#output-filename"),

        sharePaste: $("#share-paste"),
        pasteShare: $("#paste-share"),
        pasteURL: $("#paste-url"),
        copyPasteURL: $("#copy-paste-url"),
        pasteExpiration: $("#paste-expiration"),

        pasteFormat: $("#paste-format"),
        pasteViewExpiration: $("#paste-view-expiration"),
        pasteFilename: $("#paste-filename"),
        pasteContent: $("#paste-content"),
        pasteCopy: $("#paste-copy"),
        pasteDownload: $("#paste-download"),

        pasteError: $("#paste-error"),
        pasteErrorMessage: $("#paste-error-message"),
    };


    // ==========================================
    // State
    // ==========================================

    let repositoryData = null;

    let lastContent = "";
    let lastFilename = "sources.list";

    let pasteContent = "";
    let pasteFilename = "sources.list";

    let isGenerating = false;
    let isCreatingPaste = false;

    const PASTE_LIFETIME_HOURS = 2;


    // ==========================================
    // Utilities
    // ==========================================

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }


    function formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    }


    function getFileName(format) {
        const knownFormats = {
            "sources.list": "sources.list",
            "debian.sources": "debian.sources",
        };

        return knownFormats[format] || "sources.list";
    }


    function getPasteId() {
        const match = window.location.pathname.match(
            /^\/paste\/([^/]+)\/?$/
        );

        return match ? match[1] : null;
    }


    function showView(view) {
        if (dom.generatorView) {
            dom.generatorView.hidden = view !== "generator";
        }

        if (dom.pasteView) {
            dom.pasteView.hidden = view !== "paste";
        }
    }


    function flashSuccess(button, message, duration = 1600) {
        if (!button) return;

        const original = button.dataset.originalText
            || button.textContent;

        button.dataset.originalText = original;

        button.textContent = message;

        window.setTimeout(() => {
            button.textContent = original;
        }, duration);
    }


    // ==========================================
    // Theme
    // ==========================================

    function initializeTheme() {
        const storedTheme = localStorage.getItem("repo-gen-theme");

        const preferredTheme = window.matchMedia(
            "(prefers-color-scheme: light)"
        ).matches
            ? "light"
            : "dark";

        applyTheme(storedTheme || preferredTheme);
    }


    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;

        localStorage.setItem("repo-gen-theme", theme);

        if (dom.themeToggle) {
            dom.themeToggle.setAttribute(
                "aria-label",
                theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
            );

            const icon = dom.themeToggle.querySelector(".theme-icon");

            if (icon) {
                icon.textContent = theme === "dark" ? "☼" : "☾";
            }
        }
    }


    function toggleTheme() {
        const currentTheme =
            document.documentElement.dataset.theme || "dark";

        applyTheme(
            currentTheme === "dark" ? "light" : "dark"
        );
    }


    // ==========================================
    // HTTP
    // ==========================================

    async function request(url, options = {}) {
        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });
        } catch (error) {
            throw new Error(
                "Unable to connect to the server. Check your connection."
            );
        }

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const message =
                data?.detail ||
                data?.error ||
                `Request failed (${response.status})`;

            const error = new Error(message);

            error.status = response.status;

            throw error;
        }

        return data;
    }


    // ==========================================
    // Output
    // ==========================================

    function setOutput(content) {
        if (!dom.output) return;

        dom.output.textContent = content;

        lastContent = content;

        if (dom.copy) {
            dom.copy.disabled = !content;
        }

        if (dom.download) {
            dom.download.disabled = !content;
        }

        if (dom.sharePaste) {
            dom.sharePaste.disabled = !content;
        }
    }


    function showOutputError(message) {
        setOutput(`# Error\n# ${message}`);

        lastContent = "";

        if (dom.copy) dom.copy.disabled = true;
        if (dom.download) dom.download.disabled = true;
        if (dom.sharePaste) dom.sharePaste.disabled = true;
    }


    function setLoading(button, loading, label) {
        if (!button) return;

        if (loading) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = label || "Please wait...";
        } else {
            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                button.textContent;
        }
    }


    // ==========================================
    // Mirror
    // ==========================================

    function loadMirrors() {
        const mirrors = repositoryData?.official_mirrors;

        if (!mirrors || !dom.mirror) return;

        dom.mirror.innerHTML = "";

        Object.entries(mirrors).forEach(([key, value]) => {
            if (key === "security" || key === "debug" ||
                key === "security_debug") {
                return;
            }

            const option = document.createElement("option");

            option.value = value;

            option.textContent = key
                .replaceAll("_", " ")
                .replace(/\b\w/g, char => char.toUpperCase());

            dom.mirror.appendChild(option);
        });

        const custom = document.createElement("option");

        custom.value = "__custom__";
        custom.textContent = "Custom mirror";

        dom.mirror.appendChild(custom);
    }


    function handleMirrorChange() {
        const isCustom = dom.mirror.value === "__custom__";

        dom.mirrorCustom.hidden = !isCustom;

        if (isCustom) {
            dom.mirrorCustom.focus();
        }
    }


    // ==========================================
    // Releases
    // ==========================================

    function loadReleases() {
        const releases = repositoryData?.suites;

        if (!releases || !dom.release) return;

        dom.release.innerHTML = "";

        Object.entries(releases).forEach(([key, value]) => {
            const option = document.createElement("option");

            option.value = key;

            option.textContent =
                value.codename
                    ? `${key} (${value.codename})`
                    : key;

            dom.release.appendChild(option);
        });

        const stableRelease = Object.entries(releases).find(
            ([, value]) => value.codename === "stable"
        );

        if (stableRelease) {
            dom.release.value = stableRelease[0];
        } else {
            dom.release.selectedIndex = 0;
        }
    }


    // ==========================================
    // Components
    // ==========================================

    function loadComponents() {
        const components = repositoryData?.components;

        if (!Array.isArray(components) || !dom.components) {
            return;
        }

        dom.components.innerHTML = "";

        components.forEach((component, index) => {
            const label = document.createElement("label");

            label.className = "choice-item";

            const input = document.createElement("input");

            input.type = "checkbox";
            input.name = "component";
            input.value = component;

            if (component === "main" || index === 0) {
                input.checked = true;
            }

            const text = document.createElement("span");

            text.textContent = component;

            label.append(input, text);

            dom.components.appendChild(label);
        });
    }


    // ==========================================
    // Suites
    // ==========================================

    function loadSuites() {
        const releaseData =
            repositoryData?.suites?.[dom.release?.value];

        if (!releaseData || !dom.suites) return;

        dom.suites.innerHTML = "";

        const entries = [
            ...(releaseData.entries || []),
            ...(releaseData.security || []),
        ];

        [...new Set(entries)].forEach((suite, index) => {
            const label = document.createElement("label");

            label.className = "choice-item";

            const input = document.createElement("input");

            input.type = "checkbox";
            input.name = "suite";
            input.value = suite;

            input.checked = index === 0;

            const text = document.createElement("span");

            text.textContent = suite;

            label.append(input, text);

            dom.suites.appendChild(label);
        });
    }


    // ==========================================
    // Release information
    // ==========================================

    function updateReleaseInfo() {
        const releaseData =
            repositoryData?.suites?.[dom.release?.value];

        if (!releaseData || !dom.distroInfo) return;

        dom.distroInfo.hidden = false;

        setText(dom.distroAvatar, "D");
        setText(dom.distroTitle, dom.release.value);

        setText(
            dom.distroDesc,
            releaseData.description || "Debian repository configuration"
        );

        if (dom.distroTags) {
            dom.distroTags.textContent = "";

            const tags = [
                releaseData.codename,
                dom.release.value,
            ].filter(Boolean);

            tags.forEach(tag => {
                const span = document.createElement("span");

                span.className = "release-tag";
                span.textContent = tag;

                dom.distroTags.appendChild(span);
            });
        }
    }


    // ==========================================
    // Payload
    // ==========================================

    function getChecked(container) {
        return Array.from(
            container.querySelectorAll("input:checked")
        ).map(input => input.value);
    }


    function buildPayload() {
        const selectedMirror = dom.mirror.value;

        const mirror =
            selectedMirror === "__custom__"
                ? dom.mirrorCustom.value.trim()
                : selectedMirror;

        return {
            mirror,
            release: dom.release.value,
            components: getChecked(dom.components),
            suites: getChecked(dom.suites),
        };
    }


    function validatePayload(payload) {
        if (!payload.mirror) {
            return "Please select or enter a mirror.";
        }

        if (
            payload.mirror.startsWith("http://") ||
            payload.mirror.startsWith("https://")
        ) {
            // Valid URL scheme.
        } else {
            return "Mirror URL must start with http:// or https://.";
        }

        try {
            new URL(payload.mirror);
        } catch {
            return "Please enter a valid mirror URL.";
        }

        if (!payload.release) {
            return "Please select a Debian release.";
        }

        if (!payload.components.length) {
            return "Select at least one component.";
        }

        if (!payload.suites.length) {
            return "Select at least one repository suite.";
        }

        return null;
    }


    // ==========================================
    // Generate
    // ==========================================

    async function generate() {
        if (isGenerating) return;

        const payload = buildPayload();

        const validationError = validatePayload(payload);

        if (validationError) {
            showOutputError(validationError);
            return;
        }

        isGenerating = true;

        setLoading(dom.generate, true, "Generating...");

        if (dom.pasteShare) {
            dom.pasteShare.hidden = true;
        }

        try {
            const data = await request(API.generate, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (!data.content) {
                throw new Error("The server returned an empty configuration.");
            }

            lastFilename = getFileName(data.format);

            setOutput(data.content);

            setText(dom.outputFilename, lastFilename);

            updateReleaseInfo();

        } catch (error) {
            showOutputError(error.message);

        } finally {
            isGenerating = false;

            setLoading(dom.generate, false);
        }
    }


    // ==========================================
    // Clipboard
    // ==========================================

    async function copyText(content) {
        if (!content) return false;

        try {
            await navigator.clipboard.writeText(content);

            return true;

        } catch {
            const textarea = document.createElement("textarea");

            textarea.value = content;

            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.select();

            const success = document.execCommand("copy");

            textarea.remove();

            return success;
        }
    }


    async function copyOutput() {
        const success = await copyText(lastContent);

        if (success) {
            flashSuccess(dom.copy, "Copied!");
        }
    }


    // ==========================================
    // Download
    // ==========================================

    function downloadText(content, filename) {
        if (!content) return;

        const blob = new Blob(
            [content],
            { type: "text/plain;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = filename;

        document.body.appendChild(anchor);

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(url);
    }


    function downloadOutput() {
        downloadText(lastContent, lastFilename);
    }


    // ==========================================
    // Paste creation
    // ==========================================

    async function createPaste() {
        if (isCreatingPaste || !lastContent) return;

        isCreatingPaste = true;

        setLoading(dom.sharePaste, true, "Creating paste...");

        if (dom.pasteShare) {
            dom.pasteShare.hidden = true;
        }

        try {
            const data = await request(
                API.paste,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: lastContent,
                        format: lastFilename,
                    }),
                }
            );

            if (!data.id || !data.url || !data.expires_at) {
                throw new Error("Invalid response from paste server.");
            }

            const fullURL = new URL(
                data.url,
                window.location.origin
            ).href;

            dom.pasteURL.value = fullURL;

            setText(
                dom.pasteExpiration,
                `Expires: ${formatDate(data.expires_at)} · Available for two hours`
            );

            dom.pasteShare.hidden = false;

            dom.pasteShare.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });

        } catch (error) {
            alert(`Unable to create paste: ${error.message}`);

        } finally {
            isCreatingPaste = false;

            setLoading(dom.sharePaste, false);
        }
    }


    async function copyPasteURL() {
        const success = await copyText(dom.pasteURL.value);

        if (success) {
            flashSuccess(dom.copyPasteURL, "Copied!");
        }
    }


    // ==========================================
    // Paste viewer
    // ==========================================

    function showPasteError(message) {
        if (dom.pasteError) {
            dom.pasteError.hidden = false;
        }

        setText(dom.pasteErrorMessage, message);

        if (dom.pasteContent) {
            dom.pasteContent.textContent = "";
        }

        if (dom.pasteCopy) {
            dom.pasteCopy.disabled = true;
        }

        if (dom.pasteDownload) {
            dom.pasteDownload.disabled = true;
        }
    }


    async function loadPaste(pasteId) {
        showView("paste");

        setText(dom.pasteContent, "Loading paste...");

        try {
            const data = await request(
                `${API.baseURL}/paste/${encodeURIComponent(pasteId)}`
            );

            if (!data.content) {
                throw new Error("This paste contains no content.");
            }

            pasteContent = data.content;

            pasteFilename = getFileName(data.format);

            if (dom.pasteError) {
                dom.pasteError.hidden = true;
            }

            setText(dom.pasteContent, data.content);

            setText(dom.pasteFormat, data.format);
            setText(dom.pasteFilename, pasteFilename);

            setText(
                dom.pasteViewExpiration,
                formatDate(data.expires_at)
            );

            dom.pasteCopy.disabled = false;
            dom.pasteDownload.disabled = false;

            document.title = `${pasteFilename} — SourcesList`;

        } catch (error) {
            pasteContent = "";

            if (error.status === 404) {
                showPasteError(
                    "This paste could not be found or has expired."
                );
            } else if (error.status === 422) {
                showPasteError(
                    "The paste ID is invalid."
                );
            } else {
                showPasteError(error.message);
            }
        }
    }


    async function copyPasteContent() {
        const success = await copyText(pasteContent);

        if (success) {
            flashSuccess(dom.pasteCopy, "Copied!");
        }
    }


    function downloadPasteContent() {
        downloadText(pasteContent, pasteFilename);
    }


    // ==========================================
    // Initialize Generator
    // ==========================================

    async function loadRepositoryData() {
        const data = await request(
            API.options
        );

        repositoryData = data;

        loadMirrors();
        loadReleases();
        loadComponents();
        loadSuites();

        updateReleaseInfo();
    }


    function bindEvents() {
        dom.themeToggle?.addEventListener(
            "click",
            toggleTheme
        );

        dom.mirror?.addEventListener(
            "change",
            handleMirrorChange
        );

        dom.release?.addEventListener(
            "change",
            () => {
                loadSuites();
                updateReleaseInfo();
            }
        );

        dom.generate?.addEventListener(
            "click",
            generate
        );

        dom.copy?.addEventListener(
            "click",
            copyOutput
        );

        dom.download?.addEventListener(
            "click",
            downloadOutput
        );

        dom.sharePaste?.addEventListener(
            "click",
            createPaste
        );

        dom.copyPasteURL?.addEventListener(
            "click",
            copyPasteURL
        );

        dom.pasteCopy?.addEventListener(
            "click",
            copyPasteContent
        );

        dom.pasteDownload?.addEventListener(
            "click",
            downloadPasteContent
        );

        document.addEventListener("keydown", event => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key === "Enter"
            ) {
                if (!getPasteId()) {
                    generate();
                }
            }
        });
    }


    // ==========================================
    // Main
    // ==========================================

    async function initialize() {
        initializeTheme();

        bindEvents();

        const pasteId = getPasteId();

        if (pasteId) {
            await loadPaste(pasteId);
            return;
        }

        showView("generator");

        try {
            await loadRepositoryData();

        } catch (error) {
            showOutputError(
                `Unable to load repository data: ${error.message}`
            );
        }
    }


    initialize();

})();
