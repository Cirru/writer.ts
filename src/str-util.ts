export function isADigit(c: string): boolean {
  let n = c.charCodeAt(0);
  // ascii table https://tool.oschina.net/commons?type=4
  return n >= 48 && n <= 57;
}

export function isALetter(c: string): boolean {
  let n = c.charCodeAt(0);
  if (n >= 65 && n <= 90) {
    return true;
  }
  if (n >= 97 && n <= 122) {
    return true;
  }
  return false;
}
