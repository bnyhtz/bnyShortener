let _api = null;

export function setDialogApi(api) {
  _api = api;
}

export function confirm(message, title) {
  if (!_api) throw new Error('Dialog API not initialized');
  return _api.confirm(message, title);
}

export function prompt(message, defaultValue, title) {
  if (!_api) throw new Error('Dialog API not initialized');
  return _api.prompt(message, defaultValue, title);
}

export function alert(message, title) {
  if (!_api) throw new Error('Dialog API not initialized');
  return _api.alert(message, title);
}

export default { setDialogApi, confirm, prompt, alert };
