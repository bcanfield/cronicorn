import { ChevronDown } from "lucide-react";
// import Image from "next/image";

import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";

export default function SplashPage() {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Darker blur on the far left */}
      <div className="absolute top-0 left-0 w-1/3 h-96 bg-gradient-to-br from-black/60 via-gray-900/40 to-transparent blur-3xl"></div>

      {/* Blue blur in the left-center */}
      <div className="absolute top-0 left-1/4 w-1/2 h-96 bg-gradient-to-br from-blue-500/20 via-blue-600/15 to-transparent blur-3xl"></div>

      {/* Pink blur on the right */}
      <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-pink-500/20 via-purple-500/15 to-transparent blur-3xl"></div>

      {/* Background-colored blur behind hero text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-slate-900/60 blur-2xl"></div>

      {/* Faint particles scattered around */}
      <div className="absolute top-16 left-8 w-1 h-1 bg-blue-400/20 rounded-full"></div>
      <div className="absolute top-32 left-24 w-2 h-2 bg-purple-300/15 rounded-full"></div>
      <div className="absolute top-48 left-16 w-1.5 h-1.5 bg-blue-300/25 rounded-full"></div>
      <div className="absolute top-64 left-32 w-1 h-1 bg-pink-400/20 rounded-full"></div>
      <div className="absolute top-80 left-12 w-2.5 h-2.5 bg-blue-500/10 rounded-full"></div>

      <div className="absolute top-24 right-16 w-1.5 h-1.5 bg-pink-300/20 rounded-full"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400/25 rounded-full"></div>
      <div className="absolute top-56 right-8 w-2 h-2 bg-purple-400/15 rounded-full"></div>
      <div className="absolute top-72 right-24 w-1 h-1 bg-pink-500/20 rounded-full"></div>
      <div className="absolute top-88 right-40 w-1.5 h-1.5 bg-blue-300/15 rounded-full"></div>

      <div className="absolute bottom-16 left-16 w-2 h-2 bg-purple-400/20 rounded-full"></div>
      <div className="absolute bottom-32 left-8 w-1 h-1 bg-blue-500/25 rounded-full"></div>
      <div className="absolute bottom-48 left-28 w-1.5 h-1.5 bg-pink-300/15 rounded-full"></div>
      <div className="absolute bottom-64 left-20 w-1 h-1 bg-blue-400/20 rounded-full"></div>

      <div className="absolute bottom-20 right-12 w-1.5 h-1.5 bg-pink-400/25 rounded-full"></div>
      <div className="absolute bottom-36 right-28 w-1 h-1 bg-blue-300/20 rounded-full"></div>
      <div className="absolute bottom-52 right-16 w-2 h-2 bg-purple-300/15 rounded-full"></div>
      <div className="absolute bottom-68 right-36 w-1 h-1 bg-pink-500/20 rounded-full"></div>

      <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-blue-400/15 rounded-full"></div>
      <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-purple-400/20 rounded-full"></div>
      <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-pink-300/25 rounded-full"></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img
              alt="Cronicorn Logo"
              width={50}
              height={50}
              src="/icon.png"
            />
            <div className="text-white">
              <span className="font-bold text-lg">Cronicorn</span>

            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Websites
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Marketing
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Killer Domains
            </a>
          </div>

          {/* Contact Button */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">Contact</Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Invest in a
            {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Better</span>
            {" "}
            Website
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Make a Better First Impression with Personalized Web Design.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Select>
              <SelectTrigger className="w-full sm:w-64 bg-gray-800/50 border-gray-600 text-gray-300 h-12">
                <SelectValue placeholder="I need website for my business" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="business" className="text-gray-300">
                  Business Website
                </SelectItem>
                <SelectItem value="ecommerce" className="text-gray-300">
                  E-commerce Store
                </SelectItem>
                <SelectItem value="portfolio" className="text-gray-300">
                  Portfolio Site
                </SelectItem>
                <SelectItem value="blog" className="text-gray-300">
                  Blog/News Site
                </SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-12 rounded-md font-semibold">
              Get a quote
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-12 h-12 border-2 border-gray-400/30 rounded-full flex items-center justify-center animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </main>
    </div>
  );
}
