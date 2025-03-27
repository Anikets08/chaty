"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import loginService from "@/services/auth/login.auth";
import { useRouter } from "next/navigation";
import signupService from "@/services/auth/signup.auth";

type LoginFormData = {
  email: string;
  password: string;
};

type SignupFormData = LoginFormData & {
  userName: string;
};

function AuthFieldToggler() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState<LoginFormData | SignupFormData>({
    email: "",
    password: "",
    ...(isSignup && { userName: "" }),
  });

  // Memoized field change handler
  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const changeAuthType = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setFormData({
        email: "",
        password: "",
        ...(isSignup && { userName: "" }),
      }); // Reset form data when switching
      setIsSignup((prev) => !prev);
    },
    [isSignup]
  );

  const validateForm = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const hasEmptyFields = Object.values(formData).some((value) => !value);
      if (hasEmptyFields) {
        toast("Please fill all the fields");
        return;
      }

      // Handle form submission based on auth type
      setLoading(true);
      if (isSignup) {
        try {
          await signupService({
            userName: (formData as SignupFormData).userName,
            email: formData.email,
            password: formData.password,
            faceData: "",
          });
          router.replace("/");
        } catch (message) {
          console.log("Error:", message);
          toast.error(message as string);
        }
      } else {
        try {
          await loginService(formData);
          router.replace("/");
        } catch (message) {
          console.log("Error:", message);
          toast.error(message as string);
        }
      }
      setLoading(false);
    },
    [formData, isSignup]
  );

  // Render form fields dynamically
  const renderFormFields = useCallback(() => {
    const fields = [
      ...(isSignup
        ? [{ type: "text", name: "userName", placeholder: "Username" }]
        : []),
      { type: "email", name: "email", placeholder: "Email" },
      { type: "password", name: "password", placeholder: "Password" },
    ];

    return fields.map((field) => (
      <Input
        key={field.name}
        type={field.type}
        name={field.name}
        placeholder={field.placeholder}
        value={formData[field.name as keyof typeof formData] || ""}
        onChange={onFieldChange}
      />
    ));
  }, [isSignup, formData, onFieldChange]);

  return (
    <>
      <div className="w-1/2 h-full flex flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-black leading-tight tracking-tighter flex items-center">
            <Send className="w-8 h-8" />
            Chaty
          </h1>
          <p className="italic">Free, Fast and Secure</p>
        </div>

        <form
          className="flex flex-col items-start justify-center gap-2 w-1/2"
          onSubmit={validateForm}
        >
          {renderFormFields()}
          <Button className="w-full mt-4" type="submit" disabled={loading}>
            {isSignup ? "Sign Up" : "Login"}
            {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </Button>
        </form>

        <div className="flex flex-col items-center justify-start gap-2 w-1/2">
          {!isSignup && (
            <a href="" className="text-sm text-gray-500 hover:text-gray-700">
              Forgot Password?
            </a>
          )}
          <a
            href=""
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={changeAuthType}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Signup"}
          </a>
        </div>
      </div>
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={true}
        theme="dark"
        closeOnClick
        pauseOnHover
      />
    </>
  );
}

export default AuthFieldToggler;
