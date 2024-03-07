export function generatePaginationIndices(currentPage: number, totalPages: number, maxButtonCount: number): number[] {
  const pageIndices: number[] = [];
  const halfMaxButtonCount = Math.floor(maxButtonCount / 2);
  let startPage = currentPage - halfMaxButtonCount;
  let endPage = currentPage + halfMaxButtonCount;

  if (startPage < 1) {
    startPage = 1;
    endPage = Math.min(maxButtonCount, totalPages);
  }

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, totalPages - maxButtonCount + 1);
  }

  for (let page = startPage; page <= endPage; page++) {
    pageIndices.push(page);
  }

  return pageIndices;
}