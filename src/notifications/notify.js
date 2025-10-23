let _notify = null;

export function setGlobalNotify(fn) {
  _notify = fn;
}

export default function notify(message, options = {}) {
  if (_notify) {
    try { _notify(message, options); return true; } catch (e) { /* fallthrough */ }
  }
  return false;
}
