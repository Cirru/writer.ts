export enum CirruWriterNodeKind {
  writerItem,
  writerList,
}

export type CirruWriterNode =
  | {
      kind: CirruWriterNodeKind.writerItem;
      item: string;
    }
  | {
      kind: CirruWriterNodeKind.writerList;
      list: Array<CirruWriterNode>;
    };

export enum WriterNodeKind {
  writerKindNil = "nil",
  writerKindLeaf = "leaf",
  writerKindSimpleExpr = "simple",
  writerKindBoxedExpr = "boxed",
  writerKindExpr = "expr",
}

export function toString(xs: CirruWriterNode): string {
  let result = "";
  if (xs.kind == CirruWriterNodeKind.writerItem) {
    return xs.item;
  } else {
    for (let idx = 0; idx < xs.list.length; idx++) {
      let item = xs.list[idx];
      if (idx > 0) {
        result = result + " ";
      }
      if (item.kind == CirruWriterNodeKind.writerItem) {
        result = result + item.item;
      } else {
        result = result + "(" + toString(item) + ")";
      }
    }
  }
  return result;
}

export function isSimpleExpr(xs: CirruWriterNode): boolean {
  if (xs.kind == CirruWriterNodeKind.writerList) {
    for (let x of xs.list) {
      if (x.kind != CirruWriterNodeKind.writerItem) {
        return false;
      }
    }

    return true;
  } else {
    return false;
  }
}
