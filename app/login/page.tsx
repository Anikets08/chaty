import AuthFieldToggler from "@/components/custom/authFieldToggler";

import Image from "next/image";

function Login() {
  return (
    <div className="flex h-screen">
      <div className="max-w-2/4 h-full hidden md:block ">
        <Image
          src="/hero.webp"
          alt="hero"
          priority
          width={0}
          height={0}
          sizes="(max-width: 1200px) 50vw, 1200px"
          className="w-full h-full object-cover"
        />
      </div>
      <AuthFieldToggler />
    </div>
  );
}

export default Login;
