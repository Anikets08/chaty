const loginService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token);
  } else {
    throw new Error(data.message);
  }
};
export default loginService;
