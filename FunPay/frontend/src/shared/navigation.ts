export const navigationEventName = "funpay:navigation";

export function getCurrentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function getCurrentRoute(): string {
  const route = window.location.pathname.replace(/\/+$/, "");

  return route || "/register";
}

export function navigateTo(path: string, replace = false): void {
  if (replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }

  window.dispatchEvent(new Event(navigationEventName));
}

export function sanitizeReturnPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/catalog";
  }

  return path;
}
