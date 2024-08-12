import { useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import Editor from "react-simple-code-editor";
import hljs from "highlight.js";
import "highlight.js/styles/default.css";

import { ClientOnly } from "remix-utils/client-only";
import { LoaderFunctionArgs } from "@remix-run/node";
import { hostUrl } from "~/lib/env.server";
import { useLoaderData } from "@remix-run/react";
import { Switch } from "@headlessui/react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const state = JSON.parse(decodeURIComponent(url.searchParams.get("state") ?? ""));

  return { state, hostUrl };
}

export default function Screen() {
  const { state, hostUrl: _hostUrl } = useLoaderData<typeof loader>();

  const codeBlockMatch = state.cast.text.match(/```([\s\S]*?)```/);
  let codeBlock = codeBlockMatch ? codeBlockMatch[1] : "";

  // Strip the opening line and format `function`
  if (codeBlock) {
    const lines = codeBlock.split("\n");
    lines.shift();
    lines.pop();
    codeBlock = lines.join("\n");
  }

  const [code, setCode] = useState(codeBlock || "// Go ahead, write some code");

  const [language, setLanguage] = useState(detectLanguage(codeBlock));
  const [theme, setTheme] = useState("xcode-min");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [codeHeight, setCodeHeight] = useState(300);

  const languages = [
    "typescript",
    "tsx",
    "javascript",
    "jsx",
    "python",
    "java",
    "csharp",
    "cpp",
    "ruby",
    "php",
    "go",
    "rust",
    "swift",
    "scala",
    "sql",
    "html",
  ];
  const themes = new Map([
    ["xcode-min", "Warpcast"],
    ["github-dark", "GitHub Dark"],
    ["github-light", "GitHub Light"],
    ["monokai", "Monokai"],
    ["vs", "Visual Studio"],
    ["atom-one-dark", "Atom One Dark"],
    ["atom-one-light", "Atom One Light"],
  ]);

  useEffect(() => {
    // Dynamically load the selected theme's CSS
    const link = document.createElement("link");
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/${theme}.min.css`;
    link.rel = "stylesheet";
    link.type = "text/css";

    // Remove previously loaded theme
    const prevTheme = document.querySelector("link[data-hljs-theme]");
    if (prevTheme) {
      prevTheme.remove();
    }

    link.setAttribute("data-hljs-theme", "");
    document.head.appendChild(link);

    hljs.highlightAll();
  }, [theme]);

  useEffect(() => {}, [language]);

  function detectLanguage(code: string) {
    const result = hljs.highlightAuto(code);
    return result.language || "javascript";
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleFinish = async () => {
    const node = document.querySelector("#codeblock");
    if (!node) {
      return;
    }

    const canvas = await htmlToImage.toCanvas(node as HTMLElement);
    const dataUrl = canvas.toDataURL("image/png");
    const response = await fetch("/api/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageDataUrl: dataUrl }),
    });

    if (!response.ok) {
      throw new Error("oh noooo");
    }

    const data = await response.json();
    const url = `${_hostUrl}${data.path}`;
    const updatedText = state.cast.text?.replace(/```[\s\S]*?```/, "");

    window.parent.postMessage(
      {
        type: "createCast",
        data: {
          cast: {
            text: updatedText,
            embeds: [url],
          },
        },
      },
      "*"
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto flex flex-col gap-4">
      <div id="codeblock">
        <div
          className={`border rounded-lg overflow-hidden ${theme} shadow-lg`}
          style={
            {
              // background: isDarkMode ? "#1e1e1e" : "#ffffff",
              // color: isDarkMode ? "#d4d4d4" : "#000000",
            }
          }
        >
          <ClientOnly>
            {() => (
              <Editor
                value={code}
                onValueChange={handleCodeChange}
                highlight={(code) => hljs.highlight(code, { language }).value}
                padding={20}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                  height: `${codeHeight}px`,
                  background: "transparent",
                }}
                className="w-full"
              />
            )}
          </ClientOnly>
        </div>
      </div>

      <div className="mb-4 flex-col gap-4 items-center">
        <div className="flex gap-x-4">
          <div className="w-full">
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="block w-full px-2 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <div className="flex items-center gap-2">
                <SunIcon className="h-3 w-3" />
                <Switch
                  id="dark-mode-toggle"
                  checked={isDarkMode}
                  onChange={setIsDarkMode}
                  className={`${
                    isDarkMode ? "bg-slate-600" : "bg-gray-200"
                  } relative inline-flex h-5 w-9 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      isDarkMode ? "translate-x-5" : "translate-x-1"
                    } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                  />
                </Switch>
                <MoonIcon className="h-3 w-3" />
              </div>
            </div>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="block w-full px-2 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none"
            >
              {Array.from(themes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <label htmlFor="height-slider" className="block text-sm font-medium text-gray-700">
            Height
          </label>
          <input
            type="range"
            id="height-slider"
            min="100"
            max="800"
            value={codeHeight}
            onChange={(e) => setCodeHeight(parseInt(e.target.value))}
            className="w-full bg-slate-600 text-slate-600"
          />
        </div>
      </div>

      <button
        onClick={handleFinish}
        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
      >
        Embed
      </button>
    </div>
  );
}
