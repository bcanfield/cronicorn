"use client";

import { BarChart3, Brain, CheckCircle, Code, Database, Wifi, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function WorkflowDiagram() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Send daily report at 9am if data is available.";
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      }
      else {
        clearInterval(typeInterval);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-8 lg:gap-16">
        {/* Step 1: Developer Writing Rule */}
        <div className="flex-1 max-w-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Editor Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Code className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">rule.txt</span>
              </div>
            </div>

            {/* Editor Content */}
            <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm min-h-[120px]">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 select-none">1</span>
                <div className="flex-1">
                  <span className="text-blue-300">// Natural language rule</span>
                  <br />
                  <span className="text-green-300">"</span>
                  <span className="text-green-300">{typedText}</span>
                  {showCursor && <span className="text-green-300 animate-pulse">|</span>}
                  <span className="text-green-300">"</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-1">Write Natural Rules</h3>
            <p className="text-sm text-gray-600">Developer defines logic in plain English</p>
          </div>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
          </div>
          <div className="w-0 h-0 border-l-8 border-l-purple-400 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
        </div>

        {/* Step 2: AI Processing */}
        <div className="flex-1 max-w-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50"></div>

            <div className="relative z-10">
              {/* AI Brain Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-20"></div>
                  <div
                    className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-20"
                    style={{ animationDelay: "0.5s" }}
                  >
                  </div>
                </div>
              </div>

              {/* Data Streams */}
              <div className="flex justify-center gap-4 mb-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-green-400 to-transparent animate-pulse"></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div
                    className="w-0.5 h-6 bg-gradient-to-b from-blue-400 to-transparent animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  >
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-orange-600" />
                  </div>
                  <div
                    className="w-0.5 h-6 bg-gradient-to-b from-orange-400 to-transparent animate-pulse"
                    style={{ animationDelay: "0.6s" }}
                  >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-1">AI Context Monitoring</h3>
            <p className="text-sm text-gray-600">Monitors context in real time</p>
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-green-400 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            >
            </div>
          </div>
          <div className="w-0 h-0 border-l-8 border-l-green-400 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
        </div>

        {/* Step 3: Webhook Execution */}
        <div className="flex-1 max-w-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50"></div>

            <div className="relative z-10">
              {/* Webhook Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  {/* Success badge */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  {/* Success pulse */}
                  <div className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-30"></div>
                </div>
              </div>

              {/* Execution indicator */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Task Executed
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-1">Smart Execution</h3>
            <p className="text-sm text-gray-600">Executes task at the right moment</p>
          </div>
        </div>
      </div>

      {/* Bottom description */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Intelligent Task Automation</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transform natural language rules into context-aware automations that execute precisely when conditions are
          met.
        </p>
      </div>
    </div>
  );
}
