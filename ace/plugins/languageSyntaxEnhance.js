export function initJSSH(editor) {
    const JavaScriptMode = ace.require("ace/mode/javascript").Mode;
    const JavaScriptHighlightRules = ace.require("ace/mode/javascript_highlight_rules").JavaScriptHighlightRules;
    const Tokenizer = ace.require("ace/tokenizer").Tokenizer;

    class CustomJavaScriptHighlightRules extends JavaScriptHighlightRules {
        constructor() {
            super();

            const BUILTIN_CLASSES =
              "(?:String|Object|Number|Boolean|Array|Map|Set|WeakMap|WeakSet|Date|RegExp|Promise|Symbol|BigInt|Error|TypeError|RangeError|ReferenceError|SyntaxError|URIError|EvalError|AggregateError|Function|JSON|Math|Reflect|Proxy|Intl|ArrayBuffer|SharedArrayBuffer|DataView|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|BigInt64Array|BigUint64Array|URL|URLSearchParams|FormData|Blob|File|FileReader|TextEncoder|TextDecoder|AbortController|AbortSignal|WeakRef|FinalizationRegistry|Performance|WebSocket|Event|EventTarget|CustomEvent|MessageChannel|MessagePort|MessageEvent)";

            const domGlobalsRule = { token: "dom.global", regex: "\\b(?:document|window)\\b" };
            const awaitRule = { token: "custom.await", regex: "\\bawait\\b" };

            const funcDeclAsyncRule = { token: ["keyword","text","keyword","text","custom.function"], regex: "\\b(async)(\\s+)(function)(\\s+)([A-Za-z_$][\\w$]*)\\b" };
            const funcDeclRule = { token: ["keyword","text","custom.function"], regex: "\\b(function)(\\s+)([A-Za-z_$][\\w$]*)\\b" };

            const constDeclFirstRule = { token: ["keyword","text","custom.constant"], regex: "\\b(const)(\\s+)([A-Za-z_$][\\w$]*)\\b" };
            const constDeclNextRule  = { token: ["punctuation.operator","text","custom.constant"], regex: "(,)(\\s*)([A-Za-z_$][\\w$]*)(?=\\s*(?:=|,|;))" };

            const reserved = "(?:if|for|while|switch|catch|function|class|new|typeof|delete|return|do|else|try|case|throw)";
            const bareFunctionCallRule = { token: "custom.function", regex: `(?<![\\w$\\.])(?!(?:${reserved})\\b)([A-Za-z_$][\\w$]*)\\s*(?=\\()` };

            const builtinClassEverywhereRule = { token: "custom.class", regex: `(?<!\\.)\\b${BUILTIN_CLASSES}\\b` };
            const classDeclRule = { token: ["keyword","text","custom.class"], regex: "\\b(class)(\\s+)([A-Z][\\w$]*)\\b" };
            const classAfterNewBraceRule = { token: ["keyword","text","custom.class"], regex: "\\b(new)(\\s+)([A-Z][\\w$]*)(?=\\s*\\{)" };
            const classAfterNewRule = { token: ["keyword","text","custom.class"], regex: "\\b(new)(\\s+)([A-Z][\\w$]*)\\b" };

            const objectMethodCallRule = { token: ["punctuation.operator","custom.function"], regex: "(\\?\\.|\\.)\\s*([A-Za-z_$][\\w$]*)\\b(?=\\s*\\()" };
            const objectPropRule = { token: ["punctuation.operator","custom.object.prop"], regex: "(\\?\\.|\\.)\\s*([A-Za-z_$][\\w$]*)\\b(?!\\s*\\()" };

            this.__constRegexSource = "__CONST_PLACEHOLDER__";
            this.__constBaseLookaheadRule = { token: "custom.constant", regex: `\\b(${this.__constRegexSource})\\b(?=\\s*(?:\\?\\.|\\.))` };
            this.__constUseRule = { token: "custom.constant", regex: `(?<!\\.)\\b(?:${this.__constRegexSource})\\b` };

            const objectBaseBeforeChainRule = { token: "custom.object", regex: "\\b[A-Za-z_$][\\w$]*\\b(?=\\s*(?:\\?\\.|\\.)[A-Za-z_$])" };

            const add = (state, rules) => { if (!this.$rules[state]) return; rules.forEach(r => this.$rules[state].unshift(r)); };

            const ordered = [
                domGlobalsRule,
                awaitRule,
                funcDeclAsyncRule,
                funcDeclRule,
                constDeclFirstRule,
                constDeclNextRule,
                this.__constBaseLookaheadRule,
                this.__constUseRule,
                builtinClassEverywhereRule,
                objectMethodCallRule,
                objectPropRule,
                objectBaseBeforeChainRule,
                classDeclRule,
                classAfterNewBraceRule,
                classAfterNewRule,
                bareFunctionCallRule
            ];
            add("start", ordered);
            add("no_regex", ordered);
        }

        setConstNames(constNames) {
            const esc = s => s.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
            const list = Array.from(new Set((constNames || []).filter(Boolean))).sort((a,b)=>b.length-a.length);
            const source = list.length ? list.map(esc).join("|") : "(?!)";
            this.__constRegexSource = source;

            const rebuild = (arr) => {
                const i1 = arr.indexOf(this.__constBaseLookaheadRule);
                const i2 = arr.indexOf(this.__constUseRule);
                if (i1 !== -1) arr[i1] = this.__constBaseLookaheadRule = { token: "custom.constant", regex: `\\b(${this.__constRegexSource})\\b(?=\\s*(?:\\?\\.|\\.))` };
                if (i2 !== -1) arr[i2] = this.__constUseRule = { token: "custom.constant", regex: `(?<!\\.)\\b(?:${this.__constRegexSource})\\b` };
            };
            if (this.$rules.start) rebuild(this.$rules.start);
            if (this.$rules.no_regex) rebuild(this.$rules.no_regex);
        }
    }

    class CustomJavaScriptMode extends JavaScriptMode {
        constructor() { super(); this.HighlightRules = CustomJavaScriptHighlightRules; }
    }

    const mode = new CustomJavaScriptMode();
    editor.session.setMode(mode);

    function extractConstNames(code) {
        const names = new Set();
        for (const m of code.matchAll(/\bconst\s+([^;=]+?)(?==|;)/g)) {
            const ids = m[1].match(/[A-Za-z_$][\w$]*/g);
            if (ids) ids.forEach(id => names.add(id));
        }
        for (const m of code.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\b/g)) names.add(m[1]);
        return Array.from(names);
    }

    function retokenizeWithConsts() {
        const code = editor.session.getValue();
        const consts = extractConstNames(code);
        const rules = editor.session.$mode.$highlightRules;
        if (rules && typeof rules.setConstNames === "function") {
            rules.setConstNames(consts);
            editor.session.$mode.$tokenizer = new Tokenizer(rules.getRules());
            editor.session.bgTokenizer.setTokenizer(editor.session.$mode.$tokenizer);
            editor.session.bgTokenizer.start(0);
        }
    }

    retokenizeWithConsts();
    editor.session.on("change", () => retokenizeWithConsts());
}