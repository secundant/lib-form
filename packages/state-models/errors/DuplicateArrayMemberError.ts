export class DuplicateArrayMemberError extends Error {
  constructor(index: number, duplicateIndex: number) {
    super(`Field at index #${index} duplicates field at index #${duplicateIndex}`);
    this.name = 'DuplicateArrayMemberError';
  }
}
