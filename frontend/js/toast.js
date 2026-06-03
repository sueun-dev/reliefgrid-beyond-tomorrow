// Minimal toast notifications.
const wrap = () => document.getElementById("toastWrap");

export function toast(message, kind = "ok", ms = 2600) {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<span class="t-dot"></span><span>${message}</span>`;
  wrap().appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s, transform .3s";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 300);
  }, ms);
}
