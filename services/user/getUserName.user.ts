const getUserName = async (token: string): Promise<string | undefined> => {
  try {
    const response = await fetch(`/api/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching user face data:", errorData.message);
      return undefined;
    }

    const data = await response.json();
    return data.userName;
  } catch (error) {
    return undefined;
  }
};

export default getUserName;
