/**
 * DOM Test Helpers
 *
 * Utilities for view/component rendering tests.
 */

export function renderHTML(html: string): HTMLElement {
  document.body.innerHTML = html
  return document.body
}

export function querySelector<T extends Element>(selector: string): T | null {
  return document.querySelector<T>(selector)
}

export function querySelectorAll<T extends Element>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector))
}

export function getTextContent(selector: string): string | null {
  const el = document.querySelector(selector)
  return el?.textContent?.trim() ?? null
}

export function hasElement(selector: string): boolean {
  return document.querySelector(selector) !== null
}

export function countElements(selector: string): number {
  return document.querySelectorAll(selector).length
}
