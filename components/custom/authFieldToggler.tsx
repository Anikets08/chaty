"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import loginService from "@/services/auth/login.auth";
import { useRouter } from "next/navigation";
import signupService from "@/services/auth/signup.auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FaceRecognitionLogin from "@/utils/faceDetector";

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
  const [showFaceDialog, setShowFaceDialog] = useState(false);
  // const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(
  //   null
  // );
  const [token, setToken] = useState<string | null>(null);
  const [signupData, setSignupData] = useState<{
    userName: string;
    email: string;
    password: string;
  } | null>(null);
  const [loginData, setLoginData] = useState<{
    email: string;
    password: string;
  } | null>(null);
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
        // For signup, first show face detection dialog
        setSignupData({
          userName: (formData as SignupFormData).userName,
          email: formData.email,
          password: formData.password,
        });
        setShowFaceDialog(true);
        setLoading(false);
      } else {
        // For login, also show face verification dialog
        setLoginData({
          email: formData.email,
          password: formData.password,
        });
        const token = await loginService({
          email: formData.email,
          password: formData.password,
        });
        if (token) {
          setToken(token);
          setShowFaceDialog(true);
          setLoading(false);
        }
      }
    },
    [formData, isSignup]
  );

  // Handle face capture completion
  const handleFaceCaptured = useCallback(
    async (descriptor: Float32Array) => {
      if (isSignup && signupData) {
        // setFaceDescriptor(descriptor);
        setShowFaceDialog(false);
        setLoading(true);

        try {
          // Convert Float32Array to string for storage
          const faceDataString = Array.from(descriptor).toString();

          await signupService({
            userName: signupData.userName,
            email: signupData.email,
            password: signupData.password,
            faceData: faceDataString,
          });
          toast.success("Signup successful!");
          router.replace("/");
        } catch (message) {
          toast.error(message as string);
        }
        setLoading(false);
      }
    },
    [signupData, loginData, isSignup, router]
  );

  const handleFaceVerification = useCallback(
    (success: boolean) => {
      if (success) {
        toast.success("Login successful!");
        localStorage.setItem("token", token as string);
        router.replace("/");
      } else {
        toast.error("Login failed!");
      }
    },
    [router, token]
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
      <div className="w-3/4 h-full flex flex-col items-center justify-center gap-10">
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

      <Dialog
        open={showFaceDialog}
        onOpenChange={(open) => {
          if (!open) {
            setLoading(false);
          }
          setShowFaceDialog(open);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isSignup ? "Facial Recognition Setup" : "Face Verification"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              {isSignup
                ? "Please look at the camera to register your face for login verification."
                : "Please look at the camera to verify your identity."}
            </p>
            <FaceRecognitionLogin
              mode={isSignup ? "signup" : "login"}
              onFaceCaptured={handleFaceCaptured}
              onDoneVerification={handleFaceVerification}
              token={token}
            />
          </div>
        </DialogContent>
      </Dialog>

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
