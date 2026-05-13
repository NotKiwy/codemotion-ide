import { setTabNameCounter, escapeHtml } from "../lib.js"
import { ELEMENTS_EMPTY_TEXT_COMPONENT } from "./components.js"

export function handleBugsTab({ root, rootParent, bugsObject }) {
    if (!root) return;

    root.innerHTML = "";

    const bugs = Object.entries(bugsObject);
    setTabNameCounter(bugs.length);

    if(bugs.length == 0) {
        root.innerHTML = ELEMENTS_EMPTY_TEXT_COMPONENT
    }

    for (const [id, rec] of bugs) {
        const {
            self,
            resolved,
            value,
            description,
            time,
            organization
        } = rec;

        let organizationsHTML = "";
        let resolveBtnHTML = "";

        if (organization) {
            const splitted = organization.split(",").map(i => i.trim());

            if (splitted.length > 1) {
                organizationsHTML = `
                    <p class="column-element__title-element__organization clickable" data-full-org>
                        <span class="material-symbols-rounded">group</span>
                        <span data-org-target>${splitted[0]} and ${splitted.length - 1} more</span>
                    </p>`;
            } else {
                organizationsHTML = `
                    <p class="column-element__title-element__organization">
                        <span class="material-symbols-rounded">group</span>
                        ${organization}
                    </p>`;
            }
        }

        if (!resolved) {
            resolveBtnHTML = `<button class="btn done-btn" data-done>Mark as done</button>`;
        }

        root.insertAdjacentHTML("beforeend", `
            <div class="column-element ${self ? 'own' : ""} ${resolved ? 'done' : ""}" data-id="${id}">
                <div class="column-element__title">
                    <div class="column-element__title-element">
                        <p>${escapeHtml(value)} ${self ? `<span class="badge">Local</span>` : ""}</p>
                        <p class="column-element__title-element__description">${escapeHtml(description)}</p>
                        ${organizationsHTML}
                    </div>
                </div>
                <div class="column-element__time"><p>${time}</p></div>
                ${resolveBtnHTML}
            </div>
        `);
    }
    
    root.addEventListener("click", (e) => {
        const orgEl = e.target.closest("[data-full-org]");
        if (orgEl) {
            const target = orgEl.querySelector("[data-org-target]");
            const id = orgEl.closest(".column-element").dataset.id;
            const orgs = bugsObject[id].organization;

            if (target) target.textContent = orgs;
        }

        const doneBtn = e.target.closest("[data-done]");
        if (doneBtn) {
            const item = doneBtn.closest(".column-element");
            const id = item.dataset.id;

            const bug = bugsObject[id];
            if (!bug) return;

            bug.resolved = true;

            item.classList.add("done");
            doneBtn.remove();
        }
    });

    function showAllBugs() {
        rootParent.querySelectorAll(".column-element").forEach(e => {
            e.classList.remove("hidden");
        });
    }

    // segments handler

    document.querySelector("#bugs-all")?.addEventListener("click", () => {
        showAllBugs();
    });

    document.querySelector("#bugs-own")?.addEventListener("click", () => {
        showAllBugs();
        rootParent.querySelectorAll(".column-element").forEach(e => {
            if (!e.classList.contains("own")) {
                e.classList.add("hidden");
            }
        });
    });

    document.querySelector("#bugs-done")?.addEventListener("click", () => {
        showAllBugs();
        rootParent.querySelectorAll(".column-element").forEach(e => {
            if (!e.classList.contains("done")) {
                e.classList.add("hidden");
            }
        });
    });
}