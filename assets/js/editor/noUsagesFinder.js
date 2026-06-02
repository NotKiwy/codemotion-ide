export class FindNoUsages {
    static #cache = new WeakMap();

    static install(editor) {
        const allowedModes = ["javascript", "typescript"];
        const modeName = editor.session.$modeId.split("/").pop();
        const session = editor.getSession();

        if (!allowedModes.includes(modeName)) return;

        const state = {
            unused: new Set(),
            timer: null,
            version: 0,
        };

        FindNoUsages.#cache.set(editor, state);

        const original = session.bgTokenizer.getTokens.bind(session.bgTokenizer);

        session.bgTokenizer.getTokens = function (row) {
            const tokens = original(row);
            const { unused } = state;

            if (unused.size === 0) return tokens;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (
                    (token.type === "identifier" || token.type === "variable") &&
                    unused.has(token.value)
                ) {
                    token.type = "no_usage";
                }
            }

            return tokens;
        };

        FindNoUsages.#analyze(session, state);

        session.on("change", () => FindNoUsages.#scheduleAnalyze(session, state));
    }

    static #scheduleAnalyze(session, state) {
        clearTimeout(state.timer);
        state.version++;
        const v = state.version;
        state.timer = setTimeout(() => {
            if (v === state.version) FindNoUsages.#analyze(session, state);
        }, 400);
    }

    static #analyze(session, state) {
        const capturedVersion = state.version;
        const code = session.getValue();

        setTimeout(() => {
            if (capturedVersion !== state.version) return;

            const stripped = FindNoUsages.#stripNoise(code);
            const imports = FindNoUsages.#collectImports(stripped);
            const vars = FindNoUsages.#collectVars(stripped);
            const allDeclared = new Set([...imports, ...vars]);

            const unused = new Set();
            allDeclared.forEach(name => {
                if (!FindNoUsages.#isUsed(stripped, name)) unused.add(name);
            });

            if (capturedVersion !== state.version) return;

            state.unused = unused;
            session.bgTokenizer.start(0);
        }, 0);
    }

    static #stripNoise(code) {
        return code
            .replace(/`(?:[^`\\]|\\.)*`/g, '""')
            .replace(/"(?:[^"\\]|\\.)*"/g, '""')
            .replace(/'(?:[^'\\]|\\.)*'/g, "''")
            .replace(/\/\/[^\n]*/g, "")
            .replace(/\/\*[\s\S]*?\*\//g, "");
    }

    static #collectImports(code) {
        const names = new Set();
        const re = /\bimport\s+([\s\S]*?)\s+from\s+["'][^"']+["']/g;
        let m;
        while ((m = re.exec(code)) !== null) {
            FindNoUsages.#parseImportClause(m[1].trim(), names);
        }
        return names;
    }

    static #parseImportClause(clause, names) {
        const nsMatch = clause.match(/^\*\s+as\s+(\w+)$/);
        if (nsMatch) {
            names.add(nsMatch[1]);
            return;
        }

        const braceMatch = clause.match(/\{([^}]+)\}/);
        if (braceMatch) {
            braceMatch[1].split(",").forEach(part => {
                const alias = part.match(/\bas\s+(\w+)/);
                const name = alias
                    ? alias[1]
                    : part.trim().match(/^(\w+)/)?.[1];
                if (name) names.add(name);
            });
        }

        const withoutBraces = clause.replace(/\{[^}]+\}/, "").trim();
        const defaultMatch = withoutBraces.match(/^(\w+)/);
        if (defaultMatch && defaultMatch[1] !== "type") {
            names.add(defaultMatch[1]);
        }
    }

    static #collectVars(code) {
        const names = new Set();
        const re = /\b(?:const|let|var)\s+([^=;\n]+)/g;
        let m;
        while ((m = re.exec(code)) !== null) {
            FindNoUsages.#parseVarDeclaration(m[1].trim(), names);
        }
        return names;
    }

    static #parseVarDeclaration(decl, names) {
        if (decl.startsWith("{")) {
            const inner = decl.match(/^\{([^}]+)\}/)?.[1];
            if (!inner) return;
            inner.split(",").forEach(part => {
                const colonPart = part.split(":")[1] ?? part;
                const name = colonPart.trim().split(/\s*=\s*/)[0].trim().match(/^(\w+)/)?.[1];
                if (name) names.add(name);
            });
        } else if (decl.startsWith("[")) {
            const inner = decl.match(/^\[([^\]]+)\]/)?.[1];
            if (!inner) return;
            inner.split(",").forEach(part => {
                const name = part.trim().split(/\s*=\s*/)[0].trim().match(/^(\w+)/)?.[1];
                if (name && name !== "_") names.add(name);
            });
        } else {
            const name = decl.split(/\s*=\s*/)[0].trim().match(/^(\w+)/)?.[1];
            if (name) names.add(name);
        }
    }

    static #isUsed(code, name) {
        const re = new RegExp(`(?<![\\w$])${name}(?![\\w$])`, "g");
        let count = 0;
        for (const _ of code.matchAll(re)) {
            if (++count >= 2) return true;
        }
        return false;
    }

    static uninstall(editor) {
        const state = FindNoUsages.#cache.get(editor);
        if (state) {
            clearTimeout(state.timer);
            FindNoUsages.#cache.delete(editor);
        }
    }
}