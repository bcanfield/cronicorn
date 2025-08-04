import { Github } from "lucide-react";

import { DOCS_URL, GITHUB_URL } from "@/web/config/config";
import { Button } from "@workspace/ui/components/button";

// import AppLogo from "../../../../public/horn.svg?react";
import AppLogo from "../../public/horn.svg?react";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800 text-left text-sm font-light">
      <div className="max-w-7xl mx-auto px-6 py-12 ">
        <div className="flex  flex-col md:flex-row md:justify-between gap-16 md:gap-8">
          {/* Logo */}
          <div className="flex items-start">
            <AppLogo className="size-12 text-foreground " />

          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12  ">

            {/* Resources */}
            <div>
              <h3 className="text-white font-medium mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  {/* <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
                  Docs
                </Link> */}
                  {/* <a href={DOCS_URL} target="_blank">
                                 Docs
                                </a> */}
                  <a href={DOCS_URL} target="_blank" className="text-muted-foreground hover:text-foreground">
                    Docs
                  </a>

                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-white font-medium mb-4">Community</h3>
              <ul className="space-y-3">
                <li>
                  <a href={GITHUB_URL} target="_blank" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>

                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-medium mb-4">Legal</h3>
              <ul className="space-y-3">
                <li className="text-gray-400">
                  {/* <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy
                </Link> */}
                  Privacy
                </li>
                <li className="text-gray-400">
                  Terms
                  {/* <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms
                </Link> */}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section with utility buttons */}
        <div className="flex justify-end mt-8 pt-8 ">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-800">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
