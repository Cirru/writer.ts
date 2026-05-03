import * as fs from "fs";

import { writeCirruCode, writeCirruOneLiner } from "../src/writer";

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
  "comma-indent",
  "cond",
  "cond-short",
  "list-match",
  "let",
  "match",
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

// Test writeCirruOneLiner
console.log("Testing writeCirruOneLiner...");

// Test that leaf (string) throws error
try {
  writeCirruOneLiner("hello");
  throw new Error("Should have thrown error for string input");
} catch (e: any) {
  if (e.message.includes("expects an expression")) {
    console.log("✓ Leaf (string) correctly throws error");
  } else {
    throw e;
  }
}

// Test empty list
let emptyListTest = writeCirruOneLiner([]);
console.assert(emptyListTest === "", `Expected "", got "${emptyListTest}"`);
console.log("✓ Empty list test passed");

// Test simple list
let simpleListTest = writeCirruOneLiner(["a", "b", "c"]);
console.assert(simpleListTest === "a b c", `Expected "a b c", got "${simpleListTest}"`);
console.log("✓ Simple list test passed");

// Test nested list
let nestedListTest = writeCirruOneLiner(["defn", "add", ["x", "y"], ["+", "x", "y"]]);
console.assert(
  nestedListTest === "defn add (x y) (+ x y)",
  `Expected "defn add (x y) (+ x y)", got "${nestedListTest}"`
);
console.log("✓ Nested list test passed");

// Test deeply nested list
let deepNestedTest = writeCirruOneLiner(["a", ["b", ["c", ["d"]]]]);
console.assert(deepNestedTest === "a $ b $ c $ d", `Expected "a $ b $ c $ d", got "${deepNestedTest}"`);
console.log("✓ Deeply nested list test passed");

// Test list with quoted strings
let quotedStringsTest = writeCirruOneLiner(["print", "hello world", "foo bar"]);
console.assert(
  quotedStringsTest === 'print "hello world" "foo bar"',
  `Expected 'print "hello world" "foo bar"', got "${quotedStringsTest}"`
);
console.log("✓ Quoted strings in list test passed");

// Test complex expression
let complexTest = writeCirruOneLiner(["if", ["=", "x", "1"], ["println", "one"], ["println", "other"]]);
console.assert(
  complexTest === "if (= x 1) (println one) (println other)",
  `Expected 'if (= x 1) (println one) (println other)', got "${complexTest}"`
);
console.log("✓ Complex expression test passed");

// Test tail expression with $
let tailTest = writeCirruOneLiner(["a", "b", ["c", "d"]]);
console.assert(tailTest === "a b $ c d", `Expected "a b $ c d", got "${tailTest}"`);
console.log("✓ Tail expression with $ test passed");

// Test tail expression with empty list
let tailEmptyTest = writeCirruOneLiner(["a", "b", []]);
console.assert(tailEmptyTest === "a b $", `Expected "a b $", got "${tailEmptyTest}"`);
console.log("✓ Tail expression with empty list test passed");

// Test tail with nested expression
let tailNestedTest = writeCirruOneLiner(["defn", "add", ["a", "b", ["+", "a", "b"]]]);
console.assert(
  tailNestedTest === "defn add $ a b $ + a b",
  `Expected "defn add $ a b $ + a b", got "${tailNestedTest}"`
);
console.log("✓ Tail with nested expression test passed");

// Test that non-tail expressions still use parentheses
let nonTailTest = writeCirruOneLiner([["a", "b"], "c", "d"]);
console.assert(nonTailTest === "(a b) c d", `Expected "(a b) c d", got "${nonTailTest}"`);
console.log("✓ Non-tail expression uses parentheses test passed");

console.log("\nAll writeCirruOneLiner tests passed! ✓");
