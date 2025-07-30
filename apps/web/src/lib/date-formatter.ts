export default new Intl.DateTimeFormat(navigator.language, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(dateString: string, formatStr?: string): string {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  if (formatStr === "PPP") {
    return `${month} ${day}, ${year}`;
  }

  if (formatStr === "MMM d, yyyy 'at' h:mm a") {
    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`;
  }

  return date.toLocaleDateString();
}
