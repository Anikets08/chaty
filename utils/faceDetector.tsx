import getUserFacedata from "@/services/user/getUserFacedata.user";
import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";

interface FaceRecognitionLoginProps {
  mode?: "signup" | "login";
  onFaceCaptured?: (descriptor: Float32Array) => void;
  token?: string | null;
  onDoneVerification?: (success: boolean) => void;
}

function FaceRecognitionLogin({
  mode = "login",
  onFaceCaptured,
  token,
  onDoneVerification,
}: FaceRecognitionLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [internalMode, setInternalMode] = useState<"signup" | "login">(mode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const startVideo = async () => {
      setIsCameraLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            setIsCameraLoading(false);
          };
        }
      } catch (error) {
        console.error("Error accessing the camera:", error);
        setIsCameraLoading(false);
      }
    };

    startVideo();

    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      setModelsLoaded(false);
      const uri = "/models";
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(uri);
        await faceapi.nets.faceLandmark68Net.loadFromUri(uri);
        await faceapi.nets.faceRecognitionNet.loadFromUri(uri);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face recognition models:", error);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    setInternalMode(mode);
  }, [mode]);

  const handleSignup = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        if (onFaceCaptured) {
          onFaceCaptured(detection.descriptor);
        } else {
          alert("Face registered successfully!");
        }
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
    if (token === undefined || token === null) return;
    if (!videoRef.current) return;
    setIsProcessing(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const dbUserDescriptor = await getUserFacedata(token);
        if (dbUserDescriptor === null || dbUserDescriptor === undefined) return;
        const float32DbUserDescriptor = new Float32Array(
          dbUserDescriptor.split(",").map(Number)
        );
        const labeledDescriptors = [
          new faceapi.LabeledFaceDescriptors("user", [float32DbUserDescriptor]),
        ];
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4);

        const match = faceMatcher.findBestMatch(detection.descriptor);
        if (onDoneVerification) {
          onDoneVerification(match.distance < 0.4);
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
        {isCameraLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">
                {!modelsLoaded
                  ? "Loading face models..."
                  : "Initializing camera..."}
              </p>
            </div>
          </div>
        )}

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

      {!onFaceCaptured && (
        <div className="flex gap-4">
          <button
            onClick={() => setInternalMode("signup")}
            className={`px-4 py-2 rounded ${
              internalMode === "signup"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            disabled={isCameraLoading || !modelsLoaded}
          >
            Signup Mode
          </button>
          <button
            onClick={() => setInternalMode("login")}
            className={`px-4 py-2 rounded ${
              internalMode === "login"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            disabled={isCameraLoading || !modelsLoaded}
          >
            Login Mode
          </button>
        </div>
      )}

      <button
        onClick={internalMode === "signup" ? handleSignup : handleLogin}
        disabled={isProcessing || isCameraLoading || !modelsLoaded}
        className="px-6 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
      >
        {isProcessing
          ? "Processing..."
          : isCameraLoading || !modelsLoaded
          ? "Loading..."
          : internalMode === "signup"
          ? "Register Face"
          : "Login with Face"}
      </button>
    </div>
  );
}

export default FaceRecognitionLogin;
