const BASE_URL = "https://inflationcalc.app";

export interface PageMeta {
  title: string;
  description: string;
  path: string;
}

export function setPageMeta({ title, description, path }: PageMeta) {
  const url = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : `${BASE_URL}${path}`;

  document.title = title;

  const setMeta = (selector: string, attr: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      selector.split("[").forEach((part, i) => {
        if (i === 0) return;
        const [key, val] = part.replace("]", "").split("=");
        el!.setAttribute(key, val.replace(/"/g, ""));
      });
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  };

  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setLink("canonical", url);
}
