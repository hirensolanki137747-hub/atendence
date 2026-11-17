// AttendEase Email Validation
// Displays validation messages in the form instead of using alert pop-ups.
window.AttendEaseValidation = window.AttendEaseValidation || {};

window.AttendEaseValidation.validateEmail = function (email) {
  const value = String(email || "").trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!value) {
    return "Email address is required.";
  }
  if (!pattern.test(value)) {
    return "Please enter a valid email address (example: name@example.com).";
  }
  return "";
};
