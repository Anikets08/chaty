"use client";

import FaceRecognitionLogin from "@/utils/faceDetector";
import { ScanFace } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import Webcam from "react-webcam";

function Signup() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    if (name && email && password && faceData) {
      handleSignup(
        name.toString(),
        email.toString(),
        password.toString(),
        faceData.toString()
      );
    }
  };
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceData, setFaceData] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleFaceScan = () => {
    setIsFaceScanning(true);
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setFaceData(imageSrc);
      setIsFaceScanning(false);
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const handleSignup = async (
    name: string,
    email: string,
    password: string,
    faceData: string
  ) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, faceData }),
    });
    const data = await response.json();

    // check for status
    if (response.ok) {
      localStorage.setItem("token", data.token);
    } else {
      console.log("error", data.message);
    }
  };

  return (
    <div className="relative">
      <FaceRecognitionLogin />
      {isFaceScanning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Webcam
              height={720}
              screenshotFormat="image/jpeg"
              width={1280}
              videoConstraints={videoConstraints}
              ref={webcamRef}
            />
            <button
              className="bg-blue-500 text-white p-2 rounded-md"
              onClick={capturePhoto}
            >
              Capture photo
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center justify-center h-screen">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col  max-w-lg items-center justify-center p-20 gap-2"
        >
          <h1 className="text-2xl font-bold mb-10">Welcome to chaty</h1>
          <input
            name="name"
            className="border-2 border-gray-300 rounded-md p-2 w-full"
            type="text"
            placeholder="Name"
          />
          <input
            name="email"
            className="border-2 border-gray-300 rounded-md p-2 w-full"
            type="email"
            placeholder="Email"
          />
          <input
            name="password"
            className="border-2 border-gray-300 rounded-md p-2 w-full"
            type="password"
            placeholder="Password"
          />
          {faceData && (
            <img src={faceData} alt="face" className="w-full rounded-md" />
          )}
          <div
            onClick={handleFaceScan}
            className="flex items-center justify-center w-full gap-2 mt-10 cursor-pointer"
          >
            <ScanFace />
            <p>{faceData ? "Re-scan your face" : "Scan your face"}</p>
          </div>
          <button
            className="bg-blue-500 text-white w-full p-2 rounded-md mt-10"
            type="submit"
          >
            Signup
          </button>
          <Link href="/login" className="text-sm text-gray-400 mt-3">
            Already have an account? Login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Signup;
