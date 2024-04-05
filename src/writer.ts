import { CirruWriterNode, WriterNodeKind, isSimpleExpr } from "./types";
import { isADigit, isALetter } from "./str-util";

export { CirruWriterNode };

let allowedChars = "-~_@#$&%!?^*=+|\\/<>[]{}.,:;'";

function isBoxed(xs: CirruWriterNode): boolean {
  if (Array.isArray(xs)) {
    for (let idx = 0; idx < xs.length; idx++) {
      let x = xs[idx];
      if (typeof x === "string") {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function isSimpleChar(x: string): boolean {
  return isALetter(x) || isADigit(x);
}

function isCharAllowed(x: string): boolean {
  if (isSimpleChar(x)) {
    return true;
  }
  if (allowedChars.includes(x)) {
    return true;
  }
  return false;
}

let charClose = ")";
let charOpen = "(";
let charSpace = " ";

function generateLeaf(xs: CirruWriterNode): string {
  if (Array.isArray(xs)) {
    if (xs.length === 0) {
      return "()";
    } else {
      throw new Error("Unexpect list in leaf");
    }
  } else {
    let allAllowed = true;
    for (let idx = 0; idx < xs.length; idx++) {
      let x = xs[idx];
      if (!isCharAllowed(x)) {
        allAllowed = false;
        break;
      }
    }
    if (allAllowed) {
      return xs;
    } else {
      return JSON.stringify(xs);
    }
  }
}

function generateInlineExpr(xs: CirruWriterNode): string {
  let result = charOpen;

  if (Array.isArray(xs)) {
    for (let idx = 0; idx < xs.length; idx++) {
      let x = xs[idx];
      if (idx > 0) {
        result += charSpace;
      }
      let childForm = typeof x === "string" ? generateLeaf(x) : generateInlineExpr(x);
      result += childForm;
    }
  } else {
    throw new Error(`Unexpect token in gen list: ${xs}`);
  }

  return result + charClose;
}

function renderSpaces(n: number): string {
  let result = "";
  for (let i = 0; i < n; i++) {
    result += "  ";
  }
  return result;
}

function renderNewline(n: number): string {
  return "\n" + renderSpaces(n);
}

type WriterTreeOptions = { useInline: boolean };

function getNodeKind(cursor: CirruWriterNode): WriterNodeKind {
  if (typeof cursor === "string") {
    return WriterNodeKind.writerKindLeaf;
  } else {
    if (cursor.length === 0) {
      return WriterNodeKind.writerKindLeaf;
    } else if (isSimpleExpr(cursor)) {
      return WriterNodeKind.writerKindSimpleExpr;
    } else if (isBoxed(cursor)) {
      return WriterNodeKind.writerKindBoxedExpr;
    } else {
      return WriterNodeKind.writerKindExpr;
    }
  }
}

function generateTree(
  xs: CirruWriterNode,
  insistHead: boolean,
  options: WriterTreeOptions,
  baseLevel: number,
  inTail: boolean
): string {
  let prevKind = WriterNodeKind.writerKindNil;
  let bendedSize = 0;
  let level = baseLevel;
  let result = "";

  if (typeof xs === "string") {
    throw new Error("expects a list");
  }

  for (let idx = 0; idx < xs.length; idx++) {
    let cursor = xs[idx];
    let kind = getNodeKind(cursor);
    let nextLevel = level + 1;
    let childInsistHead = prevKind === WriterNodeKind.writerKindBoxedExpr || prevKind === WriterNodeKind.writerKindExpr;
    let atTail =
      idx != 0 &&
      !inTail &&
      prevKind === WriterNodeKind.writerKindLeaf &&
      idx === xs.length - 1 &&
      Array.isArray(cursor);

    // console.log("\nloop", prevKind, kind);
    // console.log("cursor", cursor);
    // console.log(JSON.stringify(result));

    let child: string = ""; // mutable

    if (typeof cursor === "string") {
      child += generateLeaf(cursor);
    } else if (atTail) {
      if (typeof cursor === "string") {
        throw new Error("Expected list");
      }
      if (cursor.length === 0) {
        child += "$";
      } else {
        child += "$ ";
        child += generateTree(cursor, false, options, level, atTail);
      }
    } else if (idx === 0 && insistHead) {
      child += generateInlineExpr(cursor);
    } else if (kind === WriterNodeKind.writerKindLeaf) {
      if (idx === 0) {
        child += renderNewline(level);
        child += generateLeaf(cursor);
      } else {
        child += generateLeaf(cursor);
      }
    } else if (kind === WriterNodeKind.writerKindSimpleExpr) {
      if (prevKind === WriterNodeKind.writerKindLeaf) {
        child += generateInlineExpr(cursor);
      } else if (options.useInline && prevKind === WriterNodeKind.writerKindSimpleExpr) {
        child += " ";
        child += generateInlineExpr(cursor);
      } else {
        child += renderNewline(nextLevel);
        child += generateTree(cursor, childInsistHead, options, nextLevel, false);
      }
    } else if (kind === WriterNodeKind.writerKindExpr) {
      let content = generateTree(cursor, childInsistHead, options, nextLevel, false);
      if (content.startsWith("\n")) {
        child += content;
      } else {
        child += renderNewline(nextLevel);
        child += content;
      }
    } else if (kind === WriterNodeKind.writerKindBoxedExpr) {
      let content = generateTree(cursor, childInsistHead, options, nextLevel, false);
      if (
        prevKind === WriterNodeKind.writerKindNil ||
        prevKind === WriterNodeKind.writerKindLeaf ||
        prevKind === WriterNodeKind.writerKindSimpleExpr
      ) {
        child += content;
      } else {
        child += renderNewline(nextLevel);
        child += content;
      }
    } else {
      throw new Error("Unexpected condition");
    }

    let bended =
      kind === WriterNodeKind.writerKindLeaf &&
      (prevKind === WriterNodeKind.writerKindBoxedExpr || prevKind === WriterNodeKind.writerKindExpr);

    if (atTail) {
      result += " ";
      result += child;
    } else if (prevKind === WriterNodeKind.writerKindLeaf && kind === WriterNodeKind.writerKindLeaf) {
      result += " ";
      result += child;
    } else if (prevKind === WriterNodeKind.writerKindLeaf && kind === WriterNodeKind.writerKindSimpleExpr) {
      result += " ";
      result += child;
    } else if (prevKind === WriterNodeKind.writerKindSimpleExpr && kind === WriterNodeKind.writerKindLeaf) {
      result += " ";
      result += child;
    } else if (bended) {
      result += renderNewline(nextLevel);
      result += ", ";
      result += child;
    } else {
      result += child;
    }

    // update writer states

    if (kind === WriterNodeKind.writerKindSimpleExpr) {
      if (idx === 0 && insistHead) {
        prevKind = WriterNodeKind.writerKindSimpleExpr;
      } else if (options.useInline) {
        if (prevKind === WriterNodeKind.writerKindLeaf || prevKind === WriterNodeKind.writerKindSimpleExpr) {
          prevKind = WriterNodeKind.writerKindSimpleExpr;
        } else {
          prevKind = WriterNodeKind.writerKindExpr;
        }
      } else {
        if (prevKind === WriterNodeKind.writerKindLeaf) {
          prevKind = WriterNodeKind.writerKindSimpleExpr;
        } else {
          prevKind = WriterNodeKind.writerKindExpr;
        }
      }
    } else {
      prevKind = kind;
    }

    if (bended) {
      bendedSize += 1;
      level += 1;
    }

    // console.log("chunk", JSON.stringify(chunk));
    // console.log("And result", JSON.stringify(result));
  }
  return result;
}

function generateStatements(xs: CirruWriterNode, options: WriterTreeOptions): string {
  if (typeof xs === "string") {
    throw new Error("Unexpected item");
  }
  return xs
    .map((x: CirruWriterNode): string => {
      return "\n" + generateTree(x, true, options, 0, false) + "\n";
    })
    .join("");
}

export function writeCirruCode(xs: CirruWriterNode, options: WriterTreeOptions = { useInline: false }): string {
  return generateStatements(xs, options);
}
