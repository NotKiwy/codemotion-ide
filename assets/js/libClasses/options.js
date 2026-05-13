export class _Options {
    static instances = new Map();

    constructor(id) {
        if (_Options.instances.has(id)) {
            return _Options.instances.get(id);
        }

        const optionsElement = document.createElement("div");
        optionsElement.className = "options-selector__wrapper";
        optionsElement.id = id;

        optionsElement.innerHTML = `
            <div class="options-selector">
                <p id="current"></p>
            </div>
            <div class="options-selector__items hidden"></div>
        `;

        this.id = id;
        this.el = optionsElement;

        optionsElement.addEventListener("click", () => {
            optionsElement
                .querySelector(".options-selector__items")
                .classList.toggle("hidden");
        });

        _Options.instances.set(id, this);
    }

    static edit(id) {
        return _Options.instances.get(id) || null;
    }

    static seeAll() {
        return Array.from(_Options.instances.values());
    }

    #makeDefault(item) {
        this.el.querySelectorAll(".options-selector__item").forEach(el => {
            el.removeAttribute("default");
        });

        item.setAttribute("default", true);
        this.el.querySelector("#current").textContent = item.textContent;
    }

    add(id, value) {
        const item = document.createElement("div");
        item.className = "options-selector__item";
        item.innerText = value;
        item.id = id;

        this.el.querySelector(".options-selector__items").appendChild(item);

        item.addEventListener("click", () => {
            this.#makeDefault(item);
        });

        return {
            default: () => this.#makeDefault(item),
            element: item
        };
    }

    on(eventName, callback) {
        const events = ["click", "dblclick"];

        if (events.includes(eventName)) {
            this.el.querySelectorAll(".options-selector__item").forEach(item => {
                item.addEventListener(eventName, () => {
                    callback(item);
                });
            });
        }
    }

    get(id) {
        let item = this.el.querySelector(`.options-selector__item#${id}`);

        if (item) {
            return {
                el: item,
                default: () => this.#makeDefault(item)
            };
        }

        return false;
    }

    appendTo(element) {
        element.appendChild(this.el)
    }
}