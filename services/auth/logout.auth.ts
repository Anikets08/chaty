const logoutService = async () => {
  // Clear localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("selectedRoomId");

  // Redirect to login page
  window.location.href = "/login";
};

export default logoutService;
