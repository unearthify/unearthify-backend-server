module.exports = function rollRecurringEvent(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(event.date);

  // event not completed yet → do nothing
  if (eventDate >= today) return false;

  const newEventDate = new Date(event.date);
  const newVisibleFrom = new Date(event.visibleFrom);

  if (event.recurrence === "yearly") {
    newEventDate.setFullYear(newEventDate.getFullYear() + 1);
    newVisibleFrom.setFullYear(newVisibleFrom.getFullYear() + 1);
  } 
  else if (event.recurrence === "monthly") {
    newEventDate.setMonth(newEventDate.getMonth() + 1);
    newVisibleFrom.setMonth(newVisibleFrom.getMonth() + 1);
  } 
  else {
    return false;
  }

  event.date = newEventDate;
  event.visibleFrom = newVisibleFrom;

  return true; // indicates event was rolled
};
