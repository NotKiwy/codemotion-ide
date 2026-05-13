export class JavascriptParser {
    getContextChain(ast, row) {
        const chain = [];
        this.traverse(ast, row, chain);
        return chain;
    }

    traverse(node, row, chain) {
        if (!node || typeof node !== "object") return;

        if (node.loc && row >= node.loc.start.line && row <= node.loc.end.line) {
            switch (node.type) {
                case "FunctionDeclaration":
                    chain.push({ icon: "function", label: node.id?.name || "anonymous()", class: "function" });
                    break;
                case "VariableDeclarator":
                    chain.push({ icon: "data_object", label: node.id.name, class: "variable" });
                    break;
                case "ClassDeclaration":
                    chain.push({ icon: "category", label: node.id.name, class: "class" });
                    break;
                case "MethodDefinition":
                    chain.push({ icon: "function", label: node.key.name, class: "method" });
                    break;
                case "CallExpression":
                    let name = "";
                    if (node.callee.type === "MemberExpression") {
                        name = `${node.callee.object.name}.${node.callee.property.name}()`;
                    } else if (node.callee.name) {
                        name = `${node.callee.name}()`;
                    }
                    name = name.replaceAll("undefined", "<...>")
                    if (name) chain.push({ icon: "deployed_code", label: name, class: "object" });
                    break;
            }
        }

        for (const key in node) {
            const val = node[key];
            if (Array.isArray(val)) val.forEach(v => this.traverse(v, row, chain));
            else if (typeof val === "object") this.traverse(val, row, chain);
        }
    }

    renderContext(chain) {
        const container = document.querySelector(".code-structure");
        container.innerHTML = "";
        if (chain.length === 0) {
            container.textContent = "No context";
            return;
        }

        chain.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "context-item";
            el.innerHTML = `
                    <span class="material-symbols-rounded ${item.class}" style="font-size:16px;">${item.icon}</span>
                    <span>${item.label}</span>
                `;
            container.appendChild(el);
            if (i < chain.length - 1) {
                const sep = document.createElement("span");
                sep.textContent = "→";
                sep.style.opacity = "0.5";
                container.appendChild(sep);
            }
        });
    }
}

export class JSONParser {
    showJSONContext(editor, contextPanel) {
        const code = editor.getValue();
        const pos = editor.getCursorPosition();
        let data;

        try {
            data = JSON.parse(code);
        } catch (err) {
            contextPanel.textContent = "Incorrect JSON";
            return;
        }

        const lines = code.split("\n");
        const currentLine = lines[pos.row];
        const path = this.getJSONPath(code, pos);
        this.renderContext(path, contextPanel);
    }

    getJSONPath(code, pos) {
        const lines = code.split("\n");
        const upToCursor = lines.slice(0, pos.row + 1).join("\n");
        const jsonText = upToCursor.replace(/\s+/g, "");

        let path = [];
        const stack = [];
        let key = "";
        let buffer = "";
        let insideString = false;

        for (let i = 0; i < jsonText.length; i++) {
            const ch = jsonText[i];
            if (ch === '"' && jsonText[i - 1] !== "\\") {
                insideString = !insideString;
                if (!insideString && buffer) {
                    key = buffer;
                    buffer = "";
                } else {
                    buffer = "";
                }
            } else if (insideString) {
                buffer += ch;
            } else if (ch === "{") {
                if (key) stack.push({ type: "object", key });
                else stack.push({ type: "object", key: null });
                key = "";
            } else if (ch === "[") {
                if (key) stack.push({ type: "array", key });
                else stack.push({ type: "array", key: null });
                key = "";
            } else if (ch === "}" || ch === "]") {
                stack.pop();
            }
        }

        path = stack.map(e => {
            let icon = e.type === "object" ? "data_object" : "data_array";
            let className = e.type === "object" ? "object" : "array";
            let label = e.key ? e.key : "";
            return { icon, label, className };
        });

        if (/\"[a-zA-Z0-9_]+\"/.test(lines[pos.row])) {
            const match = lines[pos.row].match(/\"([a-zA-Z0-9_]+)\"/);
            if (match) path.push({ icon: "token", label: match[1], className: "object" });
        }

        return path;
    }

    renderContext(chain, contextPanel) {
        contextPanel.innerHTML = "";
        if (!chain.length) {
            contextPanel.textContent = "No context";
            return;
        }

        contextPanel.style.opacity = "1";

        chain.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "context-item";
            el.innerHTML = `
            <span class="material-symbols-rounded ${item.className}">${item.icon}</span>
            ${item.label.length > 0 ? `<span>${item.label}</span>` : ""}
            `;
            contextPanel.appendChild(el);

            if (i < chain.length - 1) {
                const sep = document.createElement("span");
                sep.className = "context-separator";
                sep.textContent = "→";
                contextPanel.appendChild(sep);
            }
        });
    }
}

export class HTMLParser {

    // =========================
    // 🔹 PUBLIC API
    // =========================
    enableAutocomplete(editor) {
        editor.commands.addCommand({
            name: "expandHTMLShortcut",
            bindKey: { win: "Tab", mac: "Tab" },
            exec: (editor) => {
                const cursor = editor.getCursorPosition();
                const line = editor.session.getLine(cursor.row);
                const before = line.slice(0, cursor.column);

                const match = before.match(/([a-zA-Z0-9.#>*:+-]+)$/);
                if (!match) return;

                const expr = match[1];

                if (!this.isEmmetExpression(expr)) return;

                const html = this.expandExpression(expr);

                editor.session.replace({
                    start: {
                        row: cursor.row,
                        column: cursor.column - expr.length
                    },
                    end: cursor
                }, html);
            }
        });
    }

    isEmmetExpression(expr) {
        return /[.#>*]/.test(expr);
    }

    // =========================
    // 🔹 EMмет ENGINE
    // =========================
    expandExpression(expr) {
        // div>ul>li*3
        const parts = expr.split(">");

        let result = "";
        let current = "";

        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];

            const expanded = this.expandSingle(part, current);
            current = expanded;
        }

        return current;
    }

    expandSingle(part, innerHTML = "") {
        // li*3
        const multiMatch = part.match(/(.*)\*(\d+)/);
        if (multiMatch) {
            const base = multiMatch[1];
            const count = parseInt(multiMatch[2]);

            let result = "";
            for (let i = 0; i < count; i++) {
                result += this.expandSingle(base, innerHTML);
            }
            return result;
        }

        // input:text
        const aliasMatch = part.match(/^([a-z]+):([a-z]+)/);
        if (aliasMatch) {
            const tag = aliasMatch[1];
            const type = aliasMatch[2];
            return `<${tag} type="${type}">`;
        }

        return this.buildTag(part, innerHTML);
    }

    buildTag(expr, innerHTML = "") {
        let tag = "div";
        let id = "";
        let classes = [];

        const tagMatch = expr.match(/^[a-zA-Z][a-zA-Z0-9-]*/);
        if (tagMatch) tag = tagMatch[0];

        const idMatch = expr.match(/#([a-zA-Z0-9-_]+)/);
        if (idMatch) id = idMatch[1];

        const classMatches = [...expr.matchAll(/\.([a-zA-Z0-9-_]+)/g)];
        classes = classMatches.map(m => m[1]);

        let attrs = "";
        if (id) attrs += ` id="${id}"`;
        if (classes.length) attrs += ` class="${classes.join(" ")}"`;

        return `<${tag}${attrs}>${innerHTML}</${tag}>`;
    }

    // =========================
    // 🔹 CONTEXT (улучшенный)
    // =========================
    showHTMLContext(editor, contextPanel) {
        const code = editor.getValue();
        const pos = editor.getCursorPosition();

        const lines = code.split("\n");
        const lineIndex = pos.row;
        const cursorLine = lines[lineIndex];

        const textUpToCursor = lines.slice(0, lineIndex + 1).join("\n");

        const stack = this.parseHTMLStructure(textUpToCursor);

        const inlineTag = this.extractTagName(cursorLine);

        if (inlineTag) {
            const attrs = this.parseAttributes(cursorLine);

            const node = {
                tag: inlineTag,
                id: attrs.id ? "#" + attrs.id : "",
                cls: attrs.class ? "." + attrs.class.split(/\s+/).join(".") : ""
            };

            const last = stack[stack.length - 1];
            if (!last || JSON.stringify(last) !== JSON.stringify(node)) {
                stack.push(node);
            }
        }

        this.renderContext(stack, contextPanel);
    }

    parseHTMLStructure(htmlText) {
        const regex = /<\s*\/?\s*!?[\w:-]+(?:\s+[^>]*?)?>/g;
        const nameRe = /^<\s*\/?\s*([a-zA-Z0-9:-]+)/;

        const selfClosing = new Set([
            "area","base","br","col","embed","hr","img","input","link","meta",
            "param","source","track","wbr"
        ]);

        const ignored = new Set(["script", "style"]);

        const stack = [];
        let match;

        while ((match = regex.exec(htmlText))) {
            const fullTag = match[0];

            if (/^<!doctype/i.test(fullTag) || /^<!--/.test(fullTag)) continue;

            const nameMatch = fullTag.match(nameRe);
            if (!nameMatch) continue;

            const tag = nameMatch[1].toLowerCase();
            if (ignored.has(tag)) continue;

            if (fullTag.startsWith("</")) {
                for (let i = stack.length - 1; i >= 0; i--) {
                    if (stack[i].tag === tag) {
                        stack.splice(i, 1);
                        break;
                    }
                }
                continue;
            }

            const attrs = this.parseAttributes(fullTag);

            const node = {
                tag,
                id: attrs.id ? "#" + attrs.id : "",
                cls: attrs.class ? "." + attrs.class.split(/\s+/).join(".") : ""
            };

            const isSelfClosing =
                selfClosing.has(tag) || /\/\s*>$/.test(fullTag);

            if (!isSelfClosing) {
                stack.push(node);
            }
        }

        return stack;
    }

    parseAttributes(tag) {
        const attrs = {};
        const attrRegex = /([a-zA-Z:-]+)\s*=\s*["']?([^"'\s>]+)["']?/g;

        let match;
        while ((match = attrRegex.exec(tag))) {
            attrs[match[1]] = match[2];
        }

        return attrs;
    }

    extractTagName(line) {
        const m = line.match(/<\s*([a-zA-Z0-9:-]+)/);
        return m ? m[1].toLowerCase() : null;
    }

    // =========================
    // 🔹 RENDER
    // =========================
    renderContext(stack, contextPanel) {
        contextPanel.innerHTML = "";

        if (!stack.length) {
            contextPanel.textContent = "No context";
            return;
        }

        stack.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "context-item";

            const name = item.tag + (item.id || "") + (item.cls || "");
            const icon = this.getTagIcon(item.tag);

            el.innerHTML = `
                <span class="material-symbols-rounded">${icon}</span>
                <span>${name}</span>
            `;

            contextPanel.appendChild(el);

            if (i < stack.length - 1) {
                const sep = document.createElement("span");
                sep.textContent = "→";
                sep.style.opacity = "0.5";
                contextPanel.appendChild(sep);
            }
        });
    }

    getTagIcon(tag) {
        const icons = {
            img: "image",
            a: "link",
            ul: "format_list_bulleted",
            ol: "format_list_numbered",
            li: "token",
            table: "table",
            input: "text_fields",
            script: "code"
        };

        return icons[tag] || "deployed_code";
    }
}