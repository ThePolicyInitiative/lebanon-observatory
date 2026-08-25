import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

/**
 * Reading src/ as source text and as a syntax tree, for the suites that
 * check the shape of the copy rather than the behaviour of the code.
 *
 * The TypeScript compiler is already a devDependency, so parsing costs
 * nothing new and buys correctness the regex scans cannot have: it pairs
 * backticks across lines, tells a string literal from an identifier, and
 * survives an author reformatting a table.
 *
 * Not a `.test.ts` file, so vitest does not collect it.
 */

export const SRC = join(import.meta.dirname, "..", "src");

/** Every TypeScript and TSX file under src/, absolute paths. */
export function srcFiles(dir: string = SRC, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) srcFiles(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** The path as it reads in a failure message: everything after src/. */
export function rel(file: string): string {
  return file.split(/src[\\/]/).slice(1).join("src/").replace(/\\/g, "/");
}

export function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

export function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

/** Strips `as const`, parentheses and `satisfies` off an expression. */
export function unwrap(n: ts.Expression): ts.Expression {
  let cur = n;
  for (;;) {
    if (ts.isAsExpression(cur) || ts.isSatisfiesExpression(cur) || ts.isParenthesizedExpression(cur))
      cur = cur.expression;
    else return cur;
  }
}

/** A property's key, when it is written plainly enough to compare. */
export function propName(p: ts.ObjectLiteralElementLike): string | null {
  if (ts.isSpreadAssignment(p)) return null;
  const name = p.name;
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
    return name.text;
  return null;
}

/** The keys of an object literal, spreads and computed keys marked. */
export function keysOf(obj: ts.ObjectLiteralExpression): string[] {
  return obj.properties.map((p, i) => propName(p) ?? `<dynamic ${i}>`);
}

/** The literal text of a string or a template with nothing interpolated. */
export function literalText(n: ts.Expression): string | null {
  const e = unwrap(n);
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  return null;
}

/** Walks every node of a parsed file. */
export function walkAst(sf: ts.SourceFile, visit: (n: ts.Node) => void): void {
  const step = (n: ts.Node) => {
    visit(n);
    ts.forEachChild(n, step);
  };
  step(sf);
}

/**
 * Every string a reader could end up seeing, as the syntax tree sees it:
 * string literals, template literals of any length with the interpolated
 * expressions dropped, and JSX text. Module specifiers, asset paths and
 * `className` values are code, so they are left out.
 */
export function copyStrings(sf: ts.SourceFile): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = [];
  const add = (text: string, node: ts.Node) => {
    const s = text.trim();
    if (s.length < 4) return;
    if (/^[@./]/.test(s) || /\.(json|ts|tsx|css|svg|png|geojson)$/.test(s)) return;
    out.push({ text: s, line: lineOf(sf, node) });
  };
  walkAst(sf, (node) => {
    // Import and export specifiers are module paths, never copy.
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === "className") return;
    if (ts.isStringLiteral(node)) {
      if (node.parent && ts.isImportDeclaration(node.parent)) return;
      if (
        node.parent &&
        ts.isJsxAttribute(node.parent) &&
        node.parent.name.getText(sf) === "className"
      )
        return;
      add(node.text, node);
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
      add(node.text, node);
    } else if (ts.isTemplateExpression(node)) {
      // The interpolations are code; the fixed halves are the copy. Joined
      // with a space so a word cannot be forged across a hole.
      add(
        [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" "),
        node,
      );
    } else if (ts.isJsxText(node)) {
      add(node.text, node);
    }
  });
  return out;
}
