const logoutService = async () => {
  localStorage.removeItem("token");
};
export default logoutService;
