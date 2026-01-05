export const getTimeElapsed = (date: any) => {
  if (!date) return "";
  
  // Handle Firestore Timestamp or standard Date
  const postDate = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - postDate.getTime();

  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30.44); // Average month length
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ${months % 12}m ago`;
  if (months > 0) return `${months}m ${days % 30}d ago`;
  if (days > 0) return `${days}d ${hours % 24}h ago`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
  return "Just now";
};