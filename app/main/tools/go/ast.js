const { ipcMain } = require("electron");
const Parser = require("tree-sitter");
const Go = require("tree-sitter-go");

const parser = new Parser();
parser.setLanguage(Go);

function getLoc(node) {
    return {
        start: { line: node.startPosition.row + 1, column: node.startPosition.column },
        end: { line: node.endPosition.row + 1, column: node.endPosition.column },
    };
}

function childByType(node, type) {
    for (let i = 0; i < node.childCount; i++) {
        if (node.children[i].type === type) return node.children[i];
    }
    return null;
}

function childrenByType(node, type) {
    return node.children.filter(c => c.type === type);
}

function nodeText(node) {
    return node ? node.text : "";
}

function convertNode(node) {
    if (!node || node.type === "comment" || node.type === "ERROR") return null;

    switch (node.type) {
        case "source_file":
            return {
                type: "Program",
                loc: getLoc(node),
                body: node.children.map(convertNode).filter(Boolean),
            };

        case "function_declaration":
            return convertFunction(node);

        case "method_declaration":
            return convertMethod(node);

        case "type_declaration":
            return convertTypeDecl(node);

        case "var_declaration":
        case "short_var_declaration":
            return convertVarDecl(node);

        case "const_declaration":
            return convertConstDecl(node);

        case "import_declaration":
            return convertImport(node);

        default:
            return null;
    }
}

function convertFunction(node) {
    const nameNode = childByType(node, "identifier");
    const name = nodeText(nameNode);
    const params = convertParams(childByType(node, "parameter_list"));
    const retType = convertReturnType(node);
    const body = childByType(node, "block");

    return {
        type: "FunctionDeclaration",
        id: { name },
        params,
        returnType: retType,
        loc: getLoc(node),
        body: body ? convertBlock(body) : [],
    };
}

function convertMethod(node) {
    const receiverNode = childByType(node, "parameter_list");
    const receiver = receiverNode ? nodeText(receiverNode) : "";

    const identifiers = node.children.filter(c => c.type === "identifier");
    const name = nodeText(identifiers[0] || null);

    const paramLists = childrenByType(node, "parameter_list");
    const params = convertParams(paramLists[1] || null);
    const retType = convertReturnType(node);
    const body = childByType(node, "block");

    return {
        type: "MethodDeclaration",
        id: { name },
        receiver,
        params,
        returnType: retType,
        loc: getLoc(node),
        body: body ? convertBlock(body) : [],
    };
}

function convertTypeDecl(node) {
    const specs = childrenByType(node, "type_spec");
    if (specs.length === 0) return null;

    if (specs.length === 1) return convertTypeSpec(specs[0]);

    return {
        type: "TypeGroup",
        loc: getLoc(node),
        body: specs.map(convertTypeSpec).filter(Boolean),
    };
}

function convertTypeSpec(node) {
    const nameNode = childByType(node, "identifier") || node.children[0];
    const name = nodeText(nameNode);
    const typeNode = node.children.find(c =>
        c.type === "struct_type" ||
        c.type === "interface_type" ||
        c.type !== "identifier"
    );

    if (!typeNode) return null;

    if (typeNode.type === "struct_type") {
        return {
            type: "StructDeclaration",
            id: { name },
            fields: convertStructFields(typeNode),
            loc: getLoc(node),
        };
    }

    if (typeNode.type === "interface_type") {
        return {
            type: "InterfaceDeclaration",
            id: { name },
            methods: convertInterfaceMethods(typeNode),
            loc: getLoc(node),
        };
    }

    return {
        type: "TypeAlias",
        id: { name },
        loc: getLoc(node),
    };
}

function convertStructFields(node) {
    const fieldList = childByType(node, "field_declaration_list");
    if (!fieldList) return [];

    return fieldList.children
        .filter(c => c.type === "field_declaration")
        .map(f => {
            const idents = f.children.filter(c => c.type === "identifier" || c.type === "field_identifier");
            const typeNode = f.children.find(c =>
                c.type !== "identifier" && c.type !== "field_identifier" && c.type !== "comment"
            );
            const names = idents.map(nodeText);
            return {
                type: "StructField",
                names,
                fieldType: nodeText(typeNode),
                loc: getLoc(f),
            };
        });
}

function convertInterfaceMethods(node) {
    const body = childByType(node, "interface_body") || node;
    return body.children
        .filter(c => c.type === "method_elem" || c.type === "method_spec")
        .map(m => {
            const nameNode = childByType(m, "field_identifier") || childByType(m, "identifier");
            return {
                type: "InterfaceMethod",
                id: { name: nodeText(nameNode) },
                loc: getLoc(m),
            };
        });
}

function convertVarDecl(node) {
    if (node.type === "short_var_declaration") {
        const leftNode = childByType(node, "expression_list");
        const names = leftNode
            ? leftNode.children.filter(c => c.type === "identifier").map(nodeText)
            : [];
        return {
            type: "VariableDeclaration",
            kind: ":=",
            names,
            loc: getLoc(node),
        };
    }

    const specs = childrenByType(node, "var_spec");
    if (specs.length === 0) return null;

    const declarations = specs.map(s => {
        const idents = s.children.filter(c => c.type === "identifier").map(nodeText);
        const typeNode = s.children.find(c => c.type !== "identifier" && c.type !== "=");
        return {
            type: "VariableDeclarator",
            names: idents,
            varType: typeNode ? nodeText(typeNode) : null,
            loc: getLoc(s),
        };
    });

    return {
        type: "VariableDeclaration",
        kind: "var",
        declarations,
        loc: getLoc(node),
    };
}

function convertConstDecl(node) {
    const specs = childrenByType(node, "const_spec");
    const declarations = specs.map(s => {
        const idents = s.children.filter(c => c.type === "identifier").map(nodeText);
        return {
            type: "ConstDeclarator",
            names: idents,
            loc: getLoc(s),
        };
    });

    return {
        type: "ConstDeclaration",
        declarations,
        loc: getLoc(node),
    };
}

function convertImport(node) {
    const specs = node.children.filter(c =>
        c.type === "import_spec" || c.type === "import_spec_list"
    );

    const paths = [];
    for (const s of specs) {
        if (s.type === "import_spec_list") {
            s.children
                .filter(c => c.type === "import_spec")
                .forEach(c => {
                    const p = childByType(c, "interpreted_string_literal");
                    if (p) paths.push(nodeText(p).replace(/"/g, ""));
                });
        } else {
            const p = childByType(s, "interpreted_string_literal");
            if (p) paths.push(nodeText(p).replace(/"/g, ""));
        }
    }

    return {
        type: "ImportDeclaration",
        paths,
        loc: getLoc(node),
    };
}

function convertBlock(node) {
    const results = [];
    for (const child of node.children) {
        const c = convertBlockStatement(child);
        if (c) results.push(c);
    }
    return results;
}

function convertBlockStatement(node) {
    if (!node) return null;

    switch (node.type) {
        case "short_var_declaration":
            return convertVarDecl(node);

        case "call_expression": {
            const fnNode = node.children[0];
            const name = fnNode ? nodeText(fnNode) : "<...>";
            return {
                type: "CallExpression",
                calleeName: name.includes(".") ? `${name}()` : `${name}()`,
                loc: getLoc(node),
            };
        }

        case "expression_statement": {
            const inner = node.children[0];
            if (inner?.type === "call_expression") return convertBlockStatement(inner);
            return null;
        }

        default:
            return null;
    }
}

function convertParams(node) {
    if (!node) return [];
    return node.children
        .filter(c => c.type === "parameter_declaration" || c.type === "variadic_parameter_declaration")
        .map(p => {
            const idents = p.children.filter(c => c.type === "identifier").map(nodeText);
            const typeNode = p.children.find(c => c.type !== "identifier" && c.type !== "..." && c.type !== ",");
            return {
                names: idents,
                paramType: nodeText(typeNode),
            };
        });
}

function convertReturnType(node) {
    const children = node.children;
    const blockIdx = children.findIndex(c => c.type === "block");
    const paramLists = children.filter(c => c.type === "parameter_list");
    const lastParam = paramLists[paramLists.length - 1];
    const lastParamIdx = lastParam ? children.indexOf(lastParam) : -1;

    const retNodes = children.slice(
        Math.max(lastParamIdx + 1, 0),
        blockIdx > -1 ? blockIdx : undefined
    ).filter(c => c.type !== "comment");

    if (retNodes.length === 0) return null;
    return retNodes.map(nodeText).join(" ").trim() || null;
}

function buildAST(code) {
    try {
        const tree = parser.parse(code);
        return convertNode(tree.rootNode);
    } catch (e) {
        console.error("Go AST parse error:", e);
        return { type: "Program", loc: null, body: [] };
    }
}

ipcMain.handle("golang-ast", (_, code) => {
    return buildAST(code);
});