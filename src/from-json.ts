import { CirruWriterNode, CirruWriterNodeKind } from "./types";

export function toWriterList(xs: any): CirruWriterNode {
  if (typeof xs === "string") {
    return {
      kind: CirruWriterNodeKind.writerItem,
      item: xs,
    };
  } else if (Array.isArray(xs)) {
    return {
      kind: CirruWriterNodeKind.writerList,
      list: xs.map(toWriterList),
    };
  } else {
    throw new Error("unexpected type to gen list");
  }
}
