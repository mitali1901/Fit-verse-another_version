import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertTriangle, RefreshCw, Image as ImageIcon, Sparkles } from 'lucide-react';
import { detectPoseInImage } from '../../utils/poseDetection';
import { evaluatePose } from '../../utils/poseEvaluation';
import { drawPoseSkeleton } from '../../utils/correctionRenderer';

export default function PhotoAnalysisModal({ isOpen, onClose, selectedPose }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);
  const imgElementRef = useRef(null);
  const canvasRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please select a valid image file (JPEG or PNG).");
      return;
    }

    setErrorMessage(null);
    setEvaluation(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoaded = async () => {
    if (!imgElementRef.current) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const img = imgElementRef.current;
      const landmarks = await detectPoseInImage(img);

      if (!landmarks || landmarks.length < 20) {
        setErrorMessage("Incomplete body detected. Please ensure your entire body (head, arms, hips, and legs) is visible and well-lit.");
        setIsAnalyzing(false);
        return;
      }

      // Run evaluation
      const evalResult = evaluatePose(selectedPose?.id || 'warrior_ii', landmarks);
      setEvaluation(evalResult);

      // Render skeleton overlay on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        const ctx = canvas.getContext('2d');
        drawPoseSkeleton(ctx, landmarks, evalResult, canvas.width, canvas.height);
      }
    } catch (err) {
      console.error("Image analysis error:", err);
      setErrorMessage("Could not detect pose landmarks. Try a clearer photo with high contrast.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageSrc(null);
    setEvaluation(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-[#F0E6F7] shadow-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fitverse-purple"></span>
              <h3 className="text-xl font-bold text-fitverse-dark">Photo-Based Yoga Posture Analysis</h3>
            </div>
            <p className="text-xs text-fitverse-muted mt-0.5">
              Evaluating: <strong className="text-fitverse-purple font-semibold">{selectedPose?.name || "Warrior II"}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload State vs Analysis State */}
        {!imageSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#DBC7ED] hover:border-fitverse-purple rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-[#FAF6FD] hover:bg-[#F6EEFC] transition-colors cursor-pointer space-y-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center text-fitverse-purple">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-base text-fitverse-dark">Click to upload your yoga photograph</p>
              <p className="text-xs text-fitverse-muted mt-1">Supports PNG, JPG, or WEBP (Max 10MB)</p>
            </div>
            <div className="text-[11px] text-fitverse-muted max-w-sm bg-white/80 py-1.5 px-3 rounded-full border border-gray-100">
              💡 Tip: Full-body frontal or side-view photos under good lighting give the highest accuracy.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image + Skeleton Canvas Overlay */}
            <div className="relative rounded-2xl overflow-hidden bg-black/5 border border-[#E9D6F7] shadow-sm flex items-center justify-center">
              <img
                ref={imgElementRef}
                src={imageSrc}
                alt="Uploaded Yoga Pose"
                onLoad={handleImageLoaded}
                className="w-full h-auto max-h-[380px] object-contain block"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
                  <RefreshCw className="w-8 h-8 animate-spin text-fitverse-purple" />
                  <p className="text-xs font-bold">MediaPipe Pose Landmarker is analyzing alignment...</p>
                </div>
              )}
            </div>

            {/* Analysis Results Panel */}
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {evaluation && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Alignment Score Card */}
                  <div className="bg-[#FAF5FD] p-4 rounded-2xl border border-[#F0E6F7] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-fitverse-muted">Calculated Alignment Score</p>
                      <h4 className="text-2xl font-black text-fitverse-dark mt-0.5">
                        {evaluation.alignmentScore}%
                      </h4>
                      <span className={`text-xs font-bold ${evaluation.alignmentScore >= 75 ? 'text-fitverse-green-success' : 'text-amber-500'}`}>
                        {evaluation.statusText}
                      </span>
                    </div>

                    <div className="w-14 h-14 rounded-full bg-white shadow-xs border border-purple-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-fitverse-purple" />
                    </div>
                  </div>

                  {/* Corrections List */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-fitverse-dark">Joint Alignment Evaluation</h5>
                    {evaluation.feedbackList.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                          item.passed
                            ? "bg-fitverse-mint/60 text-fitverse-dark"
                            : "bg-[#FEECEC] text-fitverse-error font-bold"
                        }`}
                      >
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-fitverse-green-success shrink-0" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-fitverse-error shrink-0" />
                        )}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-fitverse-muted italic">
                    Note: Single-image analysis evaluates 2D posture geometry from the camera angle.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#E9D6F7] hover:bg-gray-50 text-fitverse-dark text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-fitverse-purple" />
                  <span>Upload Another Photo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

