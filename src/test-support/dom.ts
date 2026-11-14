/** Puts the body of a real page file into the test document. Scripts in it are not run. */
export function mountPage(html: string): void {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = parsed.body.innerHTML;
}

export function byTestId<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.querySelector<T>(`[data-testid="${id}"]`);
  if (!found) throw new Error(`no element with data-testid ${id}`);
  return found;
}

export const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The order Tab visits things in: every focusable, visible control in document order. */
export function tabOrder(root: ParentNode = document.body): string[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'),
  )
    .filter((el) => !el.hidden && !(el as HTMLButtonElement).disabled && el.tabIndex >= 0)
    .filter((el) => !el.closest('[hidden]'))
    .map((el) => el.getAttribute('data-testid') ?? el.id);
}
