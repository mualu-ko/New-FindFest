// src/components/utils/formatDate.js
export default function formatDate(ts) {
  if (!ts) return "";
  if (typeof ts === "object" && "_seconds" in ts) {
    return new Date(ts._seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  return ts.toString();
}
