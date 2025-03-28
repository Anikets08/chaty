const loginService = async ({
  email,
  password,
}: {
  email: string;
  password: string;
  faceData?: string;
}): Promise<string | undefined> => {
  let token: string | undefined;
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw data.message;
  }
  token = data.token;
  return token;
};

export default loginService;
