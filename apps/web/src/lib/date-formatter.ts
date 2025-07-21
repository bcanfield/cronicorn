export default new Intl.DateTimeFormat(navigator.language, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
