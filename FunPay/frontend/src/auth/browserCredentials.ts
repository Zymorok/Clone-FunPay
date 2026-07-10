type PasswordCredentialConstructor = new (form: HTMLFormElement) => Credential;

type PasswordCredentialWindow = Window & {
  PasswordCredential?: PasswordCredentialConstructor;
};

export function requestBrowserPasswordSave(form: HTMLFormElement | null, remember: boolean) {
  const PasswordCredential = (window as PasswordCredentialWindow).PasswordCredential;

  if (!remember || !form || !PasswordCredential || !navigator.credentials?.store) {
    return;
  }

  // Браузер сам решает: показать предложение сохранить или обновить пароль.
  navigator.credentials.store(new PasswordCredential(form)).catch(() => null);
}
