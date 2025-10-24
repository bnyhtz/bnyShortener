import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/Modal';
import { setDialogApi } from './dialogs';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const close = useCallback(() => setDialog(null), []);

  const confirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      const onOk = () => { resolve(true); close(); };
      const onCancel = () => { resolve(false); close(); };
      setDialog({ type: 'confirm', title, message, actions: [ { label: 'Cancel', onClick: onCancel, className: 'secondary' }, { label: 'OK', onClick: onOk, className: 'primary' } ] });
    });
  }, [close]);

  const prompt = useCallback((messageOrOptions, defaultValue = '', title = 'Input') => {
    // support calling prompt(message, defaultValue, title) or prompt({ message, defaultValue, title, inputType })
    const opts = typeof messageOrOptions === 'object' ? messageOrOptions : { message: messageOrOptions, defaultValue, title };
    return new Promise((resolve) => {
      let inputVal = opts.defaultValue || '';
      const onChange = (v) => { inputVal = v; };
      const onOk = () => { resolve(inputVal); close(); };
      const onCancel = () => { resolve(null); close(); };
      setDialog({ type: 'prompt', title: opts.title || 'Input', message: opts.message, defaultValue: opts.defaultValue, inputType: opts.inputType, onChange, actions: [ { label: 'Cancel', onClick: onCancel, className: 'secondary' }, { label: 'OK', onClick: onOk, className: 'primary' } ] });
    });
  }, [close]);

  const alert = useCallback((message, title = 'Info') => {
    return new Promise((resolve) => {
      const onOk = () => { resolve(); close(); };
      setDialog({ type: 'alert', title, message, actions: [ { label: 'OK', onClick: onOk, className: 'primary' } ] });
    });
  }, [close]);

  // register global api for non-react callers
  React.useEffect(() => {
    setDialogApi({ confirm, prompt, alert });
    return () => setDialogApi(null);
  }, [confirm, prompt, alert]);

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      <ModalRenderer dialog={dialog} onClose={close} />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}


function ModalRenderer({ dialog, onClose }) {
  const [inputValue, setInputValue] = useState(dialog ? dialog.defaultValue || '' : '');

  // keep input in sync when dialog changes
  React.useEffect(() => {
    setInputValue(dialog ? dialog.defaultValue || '' : '');
  }, [dialog]);

  if (!dialog) return null;

  const actions = (dialog.actions || []).map(a => ({ ...a, onClick: () => a.onClick && a.onClick() }));

  return (
    <Modal open={true} title={dialog.title} actions={actions} onClose={onClose}>
      <div style={{ marginBottom: '1rem' }}>{dialog.message}</div>
          {dialog.type === 'prompt' && (
            <input
              autoComplete="off"
              type={dialog.inputType || 'text'}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); if (dialog.onChange) dialog.onChange(e.target.value); }}
              style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
            />
          )}
    </Modal>
  );
}
