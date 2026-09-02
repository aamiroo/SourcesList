(() => {
    "use strict";

    /* =========================================================
       Repository Generator
       Frontend ↔ FastAPI
       ========================================================= */


    /* =========================================================
       API
       ========================================================= */

    const API = {
        baseURL: "http://127.0.0.1:8000",

        options: "http://127.0.0.1:8000/repository_data",

        generate: "http://127.0.0.1:8000/generator",
    };


    /* =========================================================
       DOM
       ========================================================= */

    const root =
        document.documentElement;

    const themeToggle =
        document.getElementById("theme-toggle");

    const mirrorSelect =
        document.getElementById("mirror");

    const mirrorCustom =
        document.getElementById("mirror-custom");

    const releaseSelect =
        document.getElementById("release");

    const componentsBox =
        document.getElementById("components");

    const suitesBox =
        document.getElementById("suites");

    const generateBtn =
        document.getElementById("generate");

    const output =
        document.getElementById("output");

    const copyBtn =
        document.getElementById("copy");

    const downloadBtn =
        document.getElementById("download");


    /* =========================================================
       State
       ========================================================= */

    let repositoryData = null;

    let lastFilename =
        "sources.list";

    let isGenerating = false;


    /* =========================================================
       Theme
       ========================================================= */

    function initializeTheme() {

        const savedTheme =
            localStorage.getItem(
                "repo-gen-theme"
            );

        const systemPrefersLight =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches;

        const theme =
            savedTheme ||
            (
                systemPrefersLight
                    ? "light"
                    : "dark"
            );

        applyTheme(theme);
    }


    function applyTheme(theme) {

        root.setAttribute(
            "data-theme",
            theme
        );

        localStorage.setItem(
            "repo-gen-theme",
            theme
        );
    }


    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                const current =
                    root.getAttribute(
                        "data-theme"
                    );

                const next =
                    current === "light"
                        ? "dark"
                        : "light";

                applyTheme(next);
            }
        );
    }


    /* =========================================================
       Output
       ========================================================= */

    function setOutput(text) {

        if (!output) return;

        output.textContent =
            text;

        output.classList.remove(
            "flash"
        );

        void output.offsetWidth;

        output.classList.add(
            "flash"
        );
    }


    function showError(message) {

        setOutput(
            "# ERROR\n" +
            "# " +
            message
        );
    }


    function setLoading(loading) {

        isGenerating =
            loading;

        if (!generateBtn) {
            return;
        }

        generateBtn.disabled =
            loading;

        generateBtn.classList.toggle(
            "loading",
            loading
        );

        generateBtn.textContent =
            loading
                ? "Generating…"
                : "Generate";
    }


    /* =========================================================
       HTTP
       ========================================================= */

    async function request(
        url,
        options = {}
    ) {

        let response;

        try {

            response =
                await fetch(
                    url,
                    options
                );

        } catch {

            throw new Error(
                "Cannot connect to FastAPI. " +
                "Make sure the backend is running."
            );
        }


        let data = null;

        try {

            data =
                await response.json();

        } catch {

            data = null;
        }


        if (!response.ok) {

            const message =
                data?.detail ||
                data?.error ||
                `HTTP ${response.status}`;

            throw new Error(
                message
            );
        }


        return data;
    }


    /* =========================================================
       Select Helper
       ========================================================= */

    function clearSelect(select) {

        if (!select) return;

        select.innerHTML = "";
    }


    function addOption(
        select,
        value,
        label,
        selected = false
    ) {

        if (!select) return;


        const option =
            document.createElement(
                "option"
            );


        option.value =
            value;

        option.textContent =
            label;


        if (selected) {

            option.selected =
                true;
        }


        select.appendChild(
            option
        );
    }


    /* =========================================================
       Mirror
       ========================================================= */

    function loadMirrors() {

        if (!mirrorSelect) {
            return;
        }


        clearSelect(
            mirrorSelect
        );


        const mirrors =
            repositoryData?.official_mirrors ||
            {};


        /*
         * Main mirror
         */

        Object.entries(
            mirrors
        ).forEach(
            ([name, url]) => {

                let label;


                switch (name) {

                    case "main":
                        label =
                            "Debian Main";
                        break;

                    case "security":
                        label =
                            "Debian Security";
                        break;

                    case "debug":
                        label =
                            "Debian Debug";
                        break;

                    case "security_debug":
                        label =
                            "Debian Security Debug";
                        break;

                    default:
                        label =
                            name;
                }


                addOption(
                    mirrorSelect,
                    url,
                    `${label} — ${url}`
                );
            }
        );


        /*
         * Custom mirror
         */

        addOption(
            mirrorSelect,
            "custom",
            "Custom Mirror"
        );


        updateCustomMirror();
    }


    function updateCustomMirror() {

        if (!mirrorCustom ||
            !mirrorSelect) {

            return;
        }


        const isCustom =
            mirrorSelect.value ===
            "custom";


        mirrorCustom.classList.toggle(
            "hidden",
            !isCustom
        );


        if (isCustom) {

            mirrorCustom.focus();
        }
    }


    if (mirrorSelect) {

        mirrorSelect.addEventListener(
            "change",
            updateCustomMirror
        );
    }


    /* =========================================================
       Releases
       ========================================================= */

    function loadReleases() {

        if (!releaseSelect) {
            return;
        }


        clearSelect(
            releaseSelect
        );


        const suites =
            repositoryData?.suites ||
            {};


        Object.entries(
            suites
        ).forEach(
            ([name, info]) => {

                const codename =
                    info.codename ||
                    "";


                let label =
                    name;


                if (codename) {

                    label =
                        `${name} — ${codename}`;
                }


                addOption(
                    releaseSelect,
                    name,
                    label
                );
            }
        );


        /*
         * Select stable by default
         */

        if (
            suites.stable
        ) {

            releaseSelect.value =
                "stable";

        } else {

            const first =
                Object.keys(
                    suites
                )[0];


            if (first) {

                releaseSelect.value =
                    first;
            }
        }
    }


    /* =========================================================
       Components
       ========================================================= */

    function loadComponents() {

        if (!componentsBox) {
            return;
        }


        componentsBox.innerHTML =
            "";


        const components =
            repositoryData?.components ||
            [];


        components.forEach(
            component => {

                const label =
                    document.createElement(
                        "label"
                    );


                label.className =
                    "generator-checkbox";


                const checkbox =
                    document.createElement(
                        "input"
                    );


                checkbox.type =
                    "checkbox";

                checkbox.name =
                    "component";

                checkbox.value =
                    component;


                /*
                 * Main is selected
                 * by default.
                 */

                if (
                    component ===
                    "main"
                ) {

                    checkbox.checked =
                        true;
                }


                const text =
                    document.createElement(
                        "span"
                    );


                text.textContent =
                    component;


                label.appendChild(
                    checkbox
                );

                label.appendChild(
                    text
                );


                componentsBox.appendChild(
                    label
                );
            }
        );
    }


    /* =========================================================
       Suites
       ========================================================= */

    function loadSuites() {

        if (!suitesBox) {
            return;
        }


        suitesBox.innerHTML =
            "";


        const selectedRelease =
            releaseSelect?.value;


        const releaseData =
            repositoryData
                ?.suites
                ?.[
                    selectedRelease
                ];


        if (!releaseData) {

            return;
        }


        /*
         * Regular repository entries
         *
         * trixie
         * trixie-updates
         * trixie-backports
         * ...
         */

        const entries =
            releaseData.entries ||
            [];


        /*
         * Security entries
         *
         * trixie-security
         */

        const security =
            releaseData.security ||
            [];


        const allSuites =
            [
                ...entries,
                ...security
            ];


        allSuites.forEach(
            (suite, index) => {

                const label =
                    document.createElement(
                        "label"
                    );


                label.className =
                    "generator-checkbox";


                const checkbox =
                    document.createElement(
                        "input"
                    );


                checkbox.type =
                    "checkbox";

                checkbox.name =
                    "suite";

                checkbox.value =
                    suite;


                /*
                 * First suite selected
                 * by default.
                 */

                if (index === 0) {

                    checkbox.checked =
                        true;
                }


                const text =
                    document.createElement(
                        "span"
                    );


                text.textContent =
                    suite;


                label.appendChild(
                    checkbox
                );

                label.appendChild(
                    text
                );


                suitesBox.appendChild(
                    label
                );
            }
        );
    }


    /* =========================================================
       Release Change
       ========================================================= */

    if (releaseSelect) {

        releaseSelect.addEventListener(
            "change",
            () => {

                loadSuites();

                updateReleaseInfo();
            }
        );
    }


    /* =========================================================
       Release Information
       ========================================================= */

    function updateReleaseInfo() {

        const release =
            releaseSelect?.value;


        const data =
            repositoryData
                ?.suites
                ?.[
                    release
                ];


        if (!data) {
            return;
        }


        console.log(
            "Selected release:",
            release
        );


        console.log(
            "Codename:",
            data.codename
        );


        console.log(
            "Repository:",
            data.repository
        );
    }


    /* =========================================================
       Get Checked Values
       ========================================================= */

    function getChecked(
        container
    ) {

        if (!container) {
            return [];
        }


        return Array.from(
            container.querySelectorAll(
                "input[type='checkbox']:checked"
            )
        ).map(
            checkbox =>
                checkbox.value
        );
    }


    /* =========================================================
       Build Payload
       ========================================================= */

    function buildPayload() {

        let mirror =
            mirrorSelect?.value ||
            "";


        /*
         * Custom mirror
         */

        if (
            mirror === "custom"
        ) {

            mirror =
                mirrorCustom
                    ?.value
                    .trim() ||
                "";
        }


        const release =
            releaseSelect?.value ||
            "";


        const components =
            getChecked(
                componentsBox
            );


        const suites =
            getChecked(
                suitesBox
            );


        return {
            mirror,
            release,
            components,
            suites
        };
    }


    /* =========================================================
       Validation
       ========================================================= */

    function validatePayload(
        payload
    ) {

        if (!payload.mirror) {

            return {
                valid: false,
                message:
                    "Please select a mirror."
            };
        }


        if (!payload.release) {

            return {
                valid: false,
                message:
                    "Please select a release."
            };
        }


        if (
            payload.components.length === 0
        ) {

            return {
                valid: false,
                message:
                    "Select at least one component."
            };
        }


        if (
            payload.suites.length === 0
        ) {

            return {
                valid: false,
                message:
                    "Select at least one suite."
            };
        }


        return {
            valid: true
        };
    }


    /* =========================================================
       Generate
       ========================================================= */

    async function generate() {

        if (isGenerating) {
            return;
        }


        const payload =
            buildPayload();


        const validation =
            validatePayload(
                payload
            );


        if (!validation.valid) {

            showError(
                validation.message
            );

            return;
        }


        setLoading(true);


        setOutput(
            "# Generating sources.list...\n" +
            "# Please wait..."
        );


        try {

            const data =
                await request(
                    API.generate,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            /*
             * Backend:
             *
             * {
             *     "format": "sources.list",
             *     "content": "..."
             * }
             */


            if (data.error) {

                throw new Error(
                    data.error
                );
            }


            const content =
                data.content ||
                "";


            if (!content) {

                throw new Error(
                    "Backend returned an empty result."
                );
            }


            setOutput(
                content
            );


            lastFilename =
                data.format ||
                "sources.list";


        } catch (error) {

            showError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    }


    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            generate
        );
    }


    /* =========================================================
       Copy
       ========================================================= */

    function flashSuccess(
        button,
        text
    ) {

        if (!button) return;


        const original =
            button.innerHTML;


        button.textContent =
            text;


        button.classList.add(
            "success"
        );


        setTimeout(
            () => {

                button.innerHTML =
                    original;

                button.classList.remove(
                    "success"
                );

            },
            1400
        );
    }


    if (copyBtn) {

        copyBtn.addEventListener(
            "click",
            async () => {

                const text =
                    output?.textContent
                        ?.trim();


                if (!text) {
                    return;
                }


                try {

                    await navigator
                        .clipboard
                        .writeText(
                            text
                        );


                    flashSuccess(
                        copyBtn,
                        "Copied!"
                    );

                } catch {

                    /*
                     * Fallback
                     */

                    const range =
                        document.createRange();


                    range.selectNode(
                        output
                    );


                    const selection =
                        window.getSelection();


                    selection
                        .removeAllRanges();


                    selection.addRange(
                        range
                    );


                    flashSuccess(
                        copyBtn,
                        "Selected!"
                    );
                }
            }
        );
    }


    /* =========================================================
       Download
       ========================================================= */

    if (downloadBtn) {

        downloadBtn.addEventListener(
            "click",
            () => {

                const text =
                    output?.textContent
                        ?.trim();


                if (!text) {
                    return;
                }


                const blob =
                    new Blob(
                        [text],
                        {
                            type:
                                "text/plain;charset=utf-8"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    url;


                link.download =
                    lastFilename ||
                    "sources.list";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );


                flashSuccess(
                    downloadBtn,
                    "Saved!"
                );
            }
        );
    }


    /* =========================================================
       Keyboard Shortcut
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key === "Enter"
            ) {

                event.preventDefault();

                generate();
            }
        }
    );


    /* =========================================================
       Load Repository Data
       ========================================================= */

    async function loadRepositoryData() {

        try {

            setOutput(
                "# Connecting to Repository Generator API..."
            );


            /*
             * GET
             *
             * /repository_data
             */

            repositoryData =
                await request(
                    API.options
                );


            /*
             * Fill everything
             */

            loadMirrors();

            loadReleases();

            loadComponents();

            loadSuites();

            updateReleaseInfo();


            setOutput(
                "# Repository data loaded successfully.\n" +
                "# Configure your options and click Generate."
            );


        } catch (error) {

            showError(
                error.message
            );
        }
    }


    /* =========================================================
       API Health Check
       ========================================================= */

    async function checkAPI() {

        try {

            const response =
                await fetch(
                    `${API.baseURL}/`,
                    {
                        method: "GET"
                    }
                );


            return response.ok;

        } catch {

            return false;
        }
    }


    /* =========================================================
       Initialize
       ========================================================= */

    async function initialize() {

        /*
         * Theme
         */

        initializeTheme();


        /*
         * Check FastAPI
         */

        const connected =
            await checkAPI();


        if (!connected) {

            showError(
                "FastAPI is not running.\n\n" +
                "Start it with:\n" +
                "uvicorn main:app --reload"
            );

            return;
        }


        /*
         * Load JSON
         */

        await loadRepositoryData();
    }


    /* =========================================================
       START
       ========================================================= */

    initialize();

})();