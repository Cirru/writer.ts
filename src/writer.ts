import { CirruWriterNode, toString, CirruWriterNodeKind, WriterNodeKind, isSimpleExpr } from "./types";
import { toWriterList } from "./from-json";
import { isADigit, isALetter } from "./str-util";

export { toWriterList, toString, CirruWriterNode, CirruWriterNodeKind };

let allowedChars = "-~_@#$&%!?^*=+|\\/<>[]{}.,:;'";

function isBoxed(xs: CirruWriterNode): boolean {
  if (xs.kind === CirruWriterNodeKind.writerList) {
    for (let x of xs.list) {
      if (x.kind === CirruWriterNodeKind.writerItem) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function isSimpleChar(x: string): boolean {
  return isADigit(x) || isALetter(x);
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
  if (xs.kind === CirruWriterNodeKind.writerList) {
    if (xs.list.length === 0) {
      return "()";
    } else {
      throw new Error("Unexpect list in leaf");
    }
  } else {
    let allAllowed = true;
    for (let x of xs.item) {
      if (!isCharAllowed(x)) {
        allAllowed = false;
        break;
      }
    }
    if (allAllowed) {
      return xs.item;
    } else {
      return JSON.stringify(xs.item);
    }
  }
}

function generateInlineExpr(xs: CirruWriterNode): string {
  let result = charOpen;

  if (xs.kind === CirruWriterNodeKind.writerList) {
    for (let idx = 0; idx < xs.list.length; idx++) {
      let x = xs.list[idx];
      if (idx > 0) {
        result = result + charSpace;
      }
      let childForm = x.kind === CirruWriterNodeKind.writerItem ? generateLeaf(x) : generateInlineExpr(x);
      result = result + childForm;
    }
  } else {
    throw new Error("Unexpect token in gen list");
  }

  return result + charClose;
}

function renderSpaces(n: number): string {
  let result = "";
  for (let i = 0; i < n; i++) {
    result = result + "  ";
  }
  return result;
}

function renderNewline(n: number): string {
  return "\n" + renderSpaces(n);
}

type WriterTreeOptions = { useInline: boolean };

function getNodeKind(cursor: CirruWriterNode): WriterNodeKind {
  if (cursor.kind === CirruWriterNodeKind.writerItem) {
    return WriterNodeKind.writerKindLeaf;
  } else {
    if (cursor.list.length === 0) {
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
  level: number,
  inTail: boolean
): string {
  let prevKind = WriterNodeKind.writerKindNil;
  let bended = false;
  let result = "";

  if (xs.kind === CirruWriterNodeKind.writerItem) {
    throw new Error("expects a list");
  }

  for (let idx = 0; idx < xs.list.length; idx++) {
    let cursor = xs.list[idx];
    let kind = getNodeKind(cursor);
    let nextLevel = level + 1;
    let childInsistHead = prevKind === WriterNodeKind.writerKindBoxedExpr || prevKind === WriterNodeKind.writerKindExpr;
    let atTail =
      idx != 0 &&
      !inTail &&
      prevKind === WriterNodeKind.writerKindLeaf &&
      idx === xs.list.length - 1 &&
      cursor.kind === CirruWriterNodeKind.writerList;

    // console.log("\nloop", prevKind, kind);
    // console.log("cursor", cursor);
    // console.log(JSON.stringify(result));

    let child: string; // mutable

    if (atTail) {
      if (cursor.kind === CirruWriterNodeKind.writerItem) {
        throw new Error("Expected list");
      }
      if (cursor.list.length === 0) {
        child = "$";
      } else {
        child = "$ " + generateTree(cursor, false, options, bended ? nextLevel : level, atTail);
      }
    } else if (kind === WriterNodeKind.writerKindLeaf) {
      child = generateLeaf(cursor);
    } else if (idx === 0 && insistHead) {
      child = generateInlineExpr(cursor);
    } else if (kind === WriterNodeKind.writerKindSimpleExpr) {
      if (prevKind === WriterNodeKind.writerKindLeaf) {
        child = generateInlineExpr(cursor);
      } else if (options.useInline && prevKind === WriterNodeKind.writerKindSimpleExpr) {
        child = " " + generateInlineExpr(cursor);
      } else {
        child = renderNewline(nextLevel) + generateTree(cursor, childInsistHead, options, nextLevel, false);
      }
    } else if (kind === WriterNodeKind.writerKindExpr) {
      child = renderNewline(nextLevel) + generateTree(cursor, childInsistHead, options, nextLevel, false);
    } else if (kind === WriterNodeKind.writerKindBoxedExpr) {
      let content = generateTree(cursor, childInsistHead, options, nextLevel, false);
      if (
        prevKind === WriterNodeKind.writerKindNil ||
        prevKind === WriterNodeKind.writerKindLeaf ||
        prevKind === WriterNodeKind.writerKindSimpleExpr
      ) {
        child = content;
      } else {
        child = renderNewline(nextLevel) + content;
      }
    } else {
      throw new Error("Unpected condition");
    }

    let chunk: string; // mutable
    if (atTail) {
      chunk = " " + child;
    } else if (prevKind === WriterNodeKind.writerKindLeaf && kind === WriterNodeKind.writerKindLeaf) {
      chunk = " " + child;
    } else if (prevKind === WriterNodeKind.writerKindLeaf && kind === WriterNodeKind.writerKindSimpleExpr) {
      chunk = " " + child;
    } else if (prevKind === WriterNodeKind.writerKindSimpleExpr && kind === WriterNodeKind.writerKindLeaf) {
      chunk = " " + child;
    } else if (
      kind === WriterNodeKind.writerKindLeaf &&
      (prevKind === WriterNodeKind.writerKindBoxedExpr || prevKind === WriterNodeKind.writerKindExpr)
    ) {
      chunk = renderNewline(nextLevel) + ", " + child;
    } else {
      chunk = child;
    }

    result = result + chunk;

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

    if (!bended) {
      if (kind === WriterNodeKind.writerKindExpr || kind === WriterNodeKind.writerKindBoxedExpr) {
        bended = true;
      }
    }

    // console.log("chunk", JSON.stringify(chunk));
    // console.log("And result", JSON.stringify(result));
  }
  return result;
}

function generateStatements(xs: CirruWriterNode, options: WriterTreeOptions): string {
  if (xs.kind === CirruWriterNodeKind.writerItem) {
    throw new Error("Unexpected item");
  }
  return xs.list
    .map((x: CirruWriterNode): string => {
      return "\n" + generateTree(x, true, options, 0, false) + "\n";
    })
    .join("");
}

export function writeCirruCode(xs: CirruWriterNode, options: WriterTreeOptions = { useInline: false }): string {
  return generateStatements(xs, options);
}
