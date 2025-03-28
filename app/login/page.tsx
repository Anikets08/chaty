import AuthFieldToggler from "@/components/custom/authFieldToggler";

import Image from "next/image";

function Login() {
  return (
    <div className="flex h-screen">
      <div className="max-w-1/4 h-full">
        <Image
          src="/hero.jpg"
          alt="hero"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-full object-cover"
        />
      </div>
      <AuthFieldToggler />
    </div>
  );
}

export default Login;
