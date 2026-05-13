import { closeAllTabs } from "../../../components/tabHandler.js";
import { buildTreeHtml } from "../render.js";
import { bindFileClicks } from "./bindFileClicksHandler.js";
import { tabsByPath, recentlyClosed } from "../../../components/tabHandler.js";

export async function openFolder({ pathRoot, filesPanel, addToHistory, pathContext, settings }) {
    closeAllTabs();
    
    if (!filesPanel) {
        console.warn("Files panel not found");
        return;
    }

    try {
        filesPanel.innerHTML = await buildTreeHtml(pathRoot);

        updatePathContext(
            {
                pathRoot: pathRoot,
                pathContext: pathContext
            }
        );
        updateTabName(pathContext);

        bindFileClicks(
            {
                scopeEl: filesPanel,
                tabsByPath: tabsByPath,
                recentlyClosed: recentlyClosed,
                pathContext: pathContext,
                settings: settings
            }
        );

        addToHistory(
            "created",
            "Project created",
            `Project in ${pathRoot} created. Now you can edit and create files`
        );

        initializeFolderToggle(filesPanel);

    } catch (error) {
        console.error("Error opening folder:", error);
        addToHistory("error", "Failed to open project", error.message);
    }
}

function updatePathContext({ pathRoot, pathContext }) {
    const parts = pathRoot.split(/\\/g);
    pathContext["rootPath"] = parts.join("/");
    pathContext["root"] = parts.pop();
}

function updateTabName(pathContext) {
    const tabElement = document.querySelector("#tab-name");
    if (tabElement) {
        tabElement.textContent = pathContext.root;
    }
}

function initializeFolderToggle(container) {
    if (container._toggleHandler) {
        container.removeEventListener("click", container._toggleHandler);
    }

    const toggleHandler = (event) => {
        const dirTitle = event.target.closest(".dir-title");

        if (!dirTitle) return;

        event.stopPropagation();

        const dirElement = dirTitle.closest(".dir");
        
        if (dirElement) {
            dirElement.classList.toggle("expanded");
        }
    };

    container._toggleHandler = toggleHandler;
    container.addEventListener("click", toggleHandler);
}

function initializeFolderToggleLegible(container) {
    if (container._toggleHandler) {
        container.removeEventListener("click", container._toggleHandler);
    }

    const toggleHandler = (event) => {
        const folderIcon = event.target.closest(".folder-icon");
        const fileName = event.target.closest(".dir-title .file");

        if (!folderIcon && !fileName) return;

        event.stopPropagation();

        const dirElement = event.currentTarget.querySelector(".dir");
        if (dirElement) {
            dirElement.classList.toggle("expanded");
        }
    };

    container._toggleHandler = toggleHandler;
    container.addEventListener("click", toggleHandler);
}