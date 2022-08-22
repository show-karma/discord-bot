export const messageContainsLink = (message: string) =>
  /http[s]?:\/\/(www\.)?(.*)?\/?(.)*/gi.test(message);
