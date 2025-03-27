import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

interface User {
  id: string;
  faceDescriptor: Float32Array;
}

function FaceRecognitionLogin() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const uri = "/models";
      await faceapi.nets.ssdMobilenetv1.loadFromUri(uri);
      await faceapi.nets.faceLandmark68Net.loadFromUri(uri);
      await faceapi.nets.faceRecognitionNet.loadFromUri(uri);
    };

    loadModels().then(startVideo);
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing the camera:", error);
      });
  };

  const handleSignup = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const newUser: User = {
          id: `user_${Date.now()}`,
          faceDescriptor: detection.descriptor,
        };
        setUsers((prev) => [...prev, newUser]);
        alert("Face registered successfully!");
      } else {
        alert("No face detected. Please try again.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("Error during signup. Please try again.");
    }

    setIsProcessing(false);
  };

  const handleLogin = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      // First check if there are any registered users
      if (users.length === 0) {
        alert("No registered users found. Please signup first.");
        setIsProcessing(false);
        return;
      }

      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        // Create a face matcher with the stored users
        const labeledDescriptors = users.map(
          (user) =>
            new faceapi.LabeledFaceDescriptors(user.id, [user.faceDescriptor])
        );
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4); // Reduced threshold to 0.4 for stricter matching

        // Try to match the detected face
        const match = faceMatcher.findBestMatch(detection.descriptor);

        if (match.distance < 0.4) {
          // Using same threshold as above
          const matchedUser = users.find((user) => user.id === match.label);
          setCurrentUser(matchedUser || null);
          alert("Login successful!");
        } else {
          alert(
            "Face not recognized. Please try again or register a new face."
          );
          setCurrentUser(null);
        }
      } else {
        alert("No face detected. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Error during login. Please try again.");
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          width="640"
          height="480"
          style={{ borderRadius: "8px" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setMode("signup")}
          className={`px-4 py-2 rounded ${
            mode === "signup" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Signup Mode
        </button>
        <button
          onClick={() => setMode("login")}
          className={`px-4 py-2 rounded ${
            mode === "login" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Login Mode
        </button>
      </div>

      <button
        onClick={mode === "signup" ? handleSignup : handleLogin}
        disabled={isProcessing}
        className="px-6 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
      >
        {isProcessing
          ? "Processing..."
          : mode === "signup"
          ? "Register Face"
          : "Login with Face"}
      </button>

      {currentUser && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>Logged in successfully! User ID: {currentUser.id}</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-4">
          <p>Registered users: {users.length}</p>
        </div>
      )}
    </div>
  );
}

export default FaceRecognitionLogin;
