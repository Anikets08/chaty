const signupService = async ({
  userName,
  email,
  password,
  faceData,
}: {
  userName: string;
  email: string;
  password: string;
  faceData: string;
}) => {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userName, email, password, faceData }),
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token);
  }
};
export default signupService;
