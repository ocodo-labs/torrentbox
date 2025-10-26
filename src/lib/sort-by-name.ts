interface ObjName {
  name: string;
}

export function compare(a: ObjName, b: ObjName) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}
