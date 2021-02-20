import * as fs from "fs";

import { writeCirruCode } from "../src/writer";

let caseNames = [
  "demo",
  "double-nesting",
  "fold-vectors",
  "folding",
  "html",
  "indent",
  "inline-let",
  "inline-simple",
  "line",
  "nested-2",
  "parentheses",
  "quote",
  "spaces",
  "unfolding",
  "append-indent",
  "cond",
];

let inlineCaseNames = ["html-inline", "inline-mode"];

console.log("try writer");

// let data = [["a", "b", ["c", ["c1", "c5", ["c3", "c4"]]], "d"]];
// echo writeCirruCode(data)

for (let name of caseNames) {
  let content = fs.readFileSync("tests/ast/" + name + ".json", "utf8");
  let v = JSON.parse(content);
  let xs = v;
  let target = fs.readFileSync("tests/cirru/" + name + ".cirru", "utf8");

  console.log("checking: ", name);
  if (writeCirruCode(xs).trim() !== target.trim()) {
    console.log("Left:");
    console.log(writeCirruCode(xs).trim());
    console.log("Right:");
    console.log(target.trim());
    throw new Error("Not equal");
  }
  console.log("");
}

for (let name of inlineCaseNames) {
  let content = fs.readFileSync("tests/ast/" + name + ".json", "utf8");
  let v = JSON.parse(content);
  let xs = v;
  let target = fs.readFileSync("tests/cirru/" + name + ".cirru", "utf8");

  console.log("checking inline: ", name);
  if (writeCirruCode(xs, { useInline: true }).trim() !== target.trim()) {
    console.log("Left:");
    console.log(writeCirruCode(xs, { useInline: true }).trim());
    console.log("Right:");
    console.log(target.trim());
    throw new Error("Not equal");
  }
  console.log("");
}
