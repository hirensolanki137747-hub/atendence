// AttendEase Password Validation
// Displays validation messages in the form instead of using alert pop-ups.
window.AttendEaseValidation = window.AttendEaseValidation || {};

window.AttendEaseValidation.validatePassword = function (password) {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  return "";
};
