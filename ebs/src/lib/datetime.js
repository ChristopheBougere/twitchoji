function formatDatetime(dateObj) {
  return `${dateObj.toISOString().split('.')[0]}Z`;
}

module.exports = {
  formatDatetime,
};
