const englishMessages: Record<string, string> = {
  "Backend недоступен. Проверьте, что сервер запущен.": "The server is unavailable. Check that it is running.",
  "Не получилось проверить поле.": "Could not validate this field.",
  "Не получилось создать аккаунт.": "Could not create the account.",
  "Не получилось войти.": "Could not log in.",
  "Не получилось проверить настройки входа через Google.": "Could not check the Google sign-in settings.",
  "Не получилось войти через Google.": "Could not sign in with Google.",
  "Не получилось отправить код. Попробуйте позже.": "Could not send the code. Please try again later.",
  "Код неверный или уже истёк.": "The code is incorrect or has expired.",
  "Подтверждение истекло. Запросите новый код.": "The verification has expired. Request a new code.",
  "Не получилось изменить пароль.": "Could not change the password.",
  "Сессия истекла. Войдите снова.": "Your session has expired. Please log in again.",
  "Не получилось выйти.": "Could not log out.",
  "Не удалось найти аккаунты.": "Could not find accounts.",
  "Не удалось обновить роль.": "Could not update the role.",
  "Не удалось загрузить список чатов.": "Could not load the chat list.",
  "Не удалось загрузить сообщения.": "Could not load messages.",
  "Не удалось перейти к выбранной дате.": "Could not open the selected date.",
  "Не удалось отправить сообщение.": "Could not send the message.",
  "Не удалось загрузить профиль.": "Could not load the profile.",
  "Профиль не найден.": "Profile not found.",
  "Не удалось загрузить предметы оформления.": "Could not load appearance items.",
  "Не удалось сохранить профиль.": "Could not save the profile.",
  "Не удалось загрузить аватарку.": "Could not upload the avatar.",
  "Не удалось обновить статус присутствия.": "Could not update your presence status.",
  "Укажи ник.": "Enter a nickname.",
  "Ник должен быть от 3 до 32 символов.": "The nickname must be between 3 and 32 characters.",
  "Укажи почту.": "Enter an email address.",
  "Почта выглядит неверно.": "Enter a valid email address.",
  "Почта слишком длинная.": "The email address is too long.",
  "Укажи пароль.": "Enter a password.",
  "Пароль должен быть от 8 до 100 символов.": "The password must be between 8 and 100 characters.",
  "Повтори пароль.": "Confirm your password.",
  "Пароли не совпадают.": "Passwords do not match.",
  "Ник может содержать латинские буквы, цифры, точку, дефис и подчёркивание.": "The nickname may contain Latin letters, numbers, a dot, a hyphen, and an underscore.",
  "Такой ник уже занят.": "This nickname is already taken.",
  "Такая почта уже занята.": "This email address is already in use.",
  "Ник или почта уже заняты.": "This nickname or email address is already in use.",
  "Неверный логин или пароль.": "Incorrect login or password.",
  "Аккаунт заблокирован.": "This account is blocked.",
  "Ник пока не подходит.": "This nickname is not valid yet.",
  "Ник свободен.": "This nickname is available.",
  "Почта пока не подходит.": "This email address is not valid yet.",
  "Почта свободна.": "This email address is available.",
  "Вход через Google пока не настроен.": "Google sign-in is not configured yet.",
  "Google не передал данные для входа.": "Google did not provide sign-in details.",
  "Не удалось подтвердить аккаунт Google. Попробуйте ещё раз.": "Could not verify the Google account. Please try again.",
  "Google-аккаунт должен иметь подтверждённую почту.": "The Google account must have a verified email address.",
  "Не удалось подобрать свободный ник. Попробуйте ещё раз.": "Could not find an available nickname. Please try again.",
  "Эта почта уже связана с другим аккаунтом Google.": "This email address is already linked to another Google account.",
  "Не удалось связать аккаунт Google. Попробуйте ещё раз.": "Could not link the Google account. Please try again.",
  "У вас нет доступа к управлению ролями.": "You do not have permission to manage roles.",
  "Поисковый запрос слишком длинный.": "The search query is too long.",
  "Выберите корректную роль.": "Select a valid role.",
  "Аккаунт не найден.": "Account not found.",
  "У вас нет доступа к редактированию этого профиля.": "You do not have permission to edit this profile.",
  "Переданы недопустимые настройки профиля.": "Some profile settings are invalid.",
  "Выбранный предмет оформления больше недоступен.": "The selected appearance item is no longer available.",
  "Укажите корректную дату рождения.": "Enter a valid birth date.",
  "Проверьте ссылки и названия контактов.": "Check the contact links and titles.",
  "Аватарка должна быть изображением до 5 МБ.": "The avatar must be an image no larger than 5 MB.",
  "Поддерживаются только JPG, PNG и WEBP.": "Only JPG, PNG, and WEBP are supported.",
  "Этот чат недоступен.": "This chat is unavailable.",
  "Сессия недействительна.": "Your session is invalid.",
  "Сообщение не может быть пустым.": "The message cannot be empty."
};

export function localizeApiMessage(message: string) {
  if (typeof localStorage === "undefined" || localStorage.getItem("funpay-language") !== "en") {
    return message;
  }

  const messageLengthMatch = message.match(/^В одном сообщении можно отправить не больше (\d+) символов\.$/);

  if (messageLengthMatch) {
    return `A message cannot contain more than ${messageLengthMatch[1]} characters.`;
  }

  return englishMessages[message]
    ?? (/[А-Яа-яЁёІіЇїЄє]/.test(message) ? "Something went wrong. Please try again." : message);
}
