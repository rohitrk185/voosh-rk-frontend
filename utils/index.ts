export const formatDate = (seconds: number) => {
  const date = new Date(seconds * 1000); // Convert seconds to milliseconds

  // Define options for formatting the date
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-hour format
  };

  // Use Intl.DateTimeFormat to format the date
  return new Intl.DateTimeFormat("en-GB", options).format(date);
};
