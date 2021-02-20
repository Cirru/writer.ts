export type CirruWriterNode = Array<CirruWriterNode> | string;
export enum WriterNodeKind {
  writerKindNil = "nil",
  writerKindLeaf = "leaf",
  writerKindSimpleExpr = "simple",
  writerKindBoxedExpr = "boxed",
  writerKindExpr = "expr",
}

export function isSimpleExpr(xs: CirruWriterNode): boolean {
  if (Array.isArray(xs)) {
    for (let x of xs) {
      if (typeof x !== "string") {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}
