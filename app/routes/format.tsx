/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import Editor from "react-simple-code-editor";
import hljs from "highlight.js";
import "highlight.js/styles/default.css";
import { ClientOnly } from "remix-utils/client-only";
import { LoaderFunctionArgs } from "@remix-run/node";
import { hostUrl } from "~/lib/env.server";
import { useLoaderData } from "@remix-run/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useDarkMode } from "~/components/dark-mode";

// This should be moved to a separate file, e.g., `app/components/CodeEditor.tsx`
interface CodeEditorProps {
  initialCode: string;
  language?: string;
  theme: string;
  fontSize: number;
  height?: number;
}

function CodeEditor(props: CodeEditorProps) {
  const { initialCode, language, fontSize, theme, height } = props;
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/${theme}.min.css`;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.setAttribute("data-hljs-theme", "");
    document.head.appendChild(link);

    return () => link.remove();
  }, [theme]);

  return (
    <div id="codeblock">
      <div className={`rounded-lg overflow-hidden ${theme} shadow-xl`}>
        <ClientOnly>
          {() => (
            <div className="hljs">
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={(code) => hljs.highlightAuto(code, language ? [language] : undefined).value}
                padding={20}
                style={{
                  fontFamily: '"MonSans", monospace',
                  fontSize: `${fontSize}px`,
                  height: height ? `${height}px` : undefined,
                }}
                className="w-full"
              />
            </div>
          )}
        </ClientOnly>
      </div>
    </div>
  );
}

interface CustomizationPanelProps {
  language: string | undefined;
  setLanguage: (lang: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  height: number | undefined;
  setHeight: (height: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

function CustomizationPanel(props: CustomizationPanelProps) {
  const { language, setLanguage, theme, setTheme, height, setHeight, fontSize, setFontSize } = props;
  const [isOpen, setIsOpen] = useState(false);
  const languages = ["typescript", "javascript", "python", "java", "cpp", "ruby", "go", "rust"];
  const themes = new Map([
    ["github-dark", "GitHub Dark"],
    ["github-light", "GitHub Light"],
    ["monokai", "Monokai"],
    ["vs", "Visual Studio"],
    ["atom-one-dark", "Atom One Dark"],
    ["atom-one-light", "Atom One Light"],
  ]);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="dark:text-white">Customize</span>
        <ChevronDownIcon
          className={`h-5 w-5 transform transition-transform ${isOpen ? "rotate-180" : ""} dark:text-white`}
        />
      </button>
      {isOpen && (
        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex gap-x-4 mb-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="block w-full px-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">Auto Detect</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="block w-full px-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300"
            >
              {Array.from(themes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Height</label>
            <input
              type="range"
              min="100"
              max="800"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="w-full bg-purple-500 text-purple-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</label>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full bg-purple-500 text-purple-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{fontSize}px</span>
          </div>
        </div>
      )}
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const rawState = url.searchParams.get("state");
  const state = JSON.parse(rawState ?? "{}");
  return { state, hostUrl };
}

export default function Screen() {
  const { state, hostUrl: _hostUrl } = useLoaderData<typeof loader>();
  const { isDarkMode } = useDarkMode();

  const [language, setLanguage] = useState<string | undefined>();
  const [theme, setTheme] = useState(isDarkMode ? "atom-one-dark" : "atom-one-light");
  const [height, setHeight] = useState<number | undefined>();
  const [fontSize, setFontSize] = useState(16.875);
  const [isLoading, setIsLoading] = useState(false);

  const pattern = /(?:```|:::)([\s\S]*?)(?:```|:::)/;
  const codeBlockMatch = state.cast.text.match(pattern);

  const initialCode = codeBlockMatch ? toAscii(codeBlockMatch[1].trim()) : "// Go ahead, write some code";

  const handleFinish = async () => {
    setIsLoading(true);
    const node = document.querySelector("#codeblock");
    if (!node) return;

    // bug fix: for react native web view on ios
    // without calling toCanvas twice it renders blank.
    // ty: haole#3346
    await htmlToImage.toCanvas(node as HTMLElement);
    const canvas = await htmlToImage.toCanvas(node as HTMLElement);
    const dataUrl = canvas.toDataURL("image/png");

    const response = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: dataUrl }),
    });

    setIsLoading(false);

    if (!response.ok) throw new Error("Failed to upload image");

    const data = await response.json();
    const url = `${_hostUrl}${data.path}`;
    const updatedText = state.cast.text?.replace(pattern, "");

    const updatedEmbeds = [...(state.cast.embeds || [])];
    if (updatedEmbeds.length > 1) {
      updatedEmbeds[1] = url;
    } else {
      updatedEmbeds.push(url);
    }

    window.parent.postMessage(
      {
        type: "createCast",
        data: { cast: { text: updatedText, embeds: updatedEmbeds } },
      },
      "*"
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto flex flex-col gap-4 mt-8">
      <CodeEditor
        initialCode={initialCode}
        language={language}
        theme={theme}
        fontSize={fontSize}
        height={height}
      />
      <CustomizationPanel
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        height={height || 0}
        setHeight={setHeight}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
      <button
        onClick={handleFinish}
        className={`px-4 py-2 ${isLoading ? "bg-gray-400" : "bg-purple-500"} text-white rounded-md hover:${
          isLoading ? "" : "bg-purple-600"
        } transition-colors`}
        disabled={isLoading}
      >
        {isLoading ? "Embedding..." : "Embed"}
      </button>
    </div>
  );
}

function toAscii(text: string): string {
  return text
    .replace(/“/g, '"') // Curly opening quote
    .replace(/”/g, '"') // Curly closing quote
    .replace(/‘/g, "'") // Curly opening single quote
    .replace(/’/g, "'") // Curly closing single quote
    .replace(/…/g, "...") // Ellipses
    .replace(/—/g, "--") // Em dash
    .replace(/–/g, "-") // En dash
    .replace(/•/g, "*") // Bullet point
    .replace(/©/g, "(c)") // Copyright symbol
    .replace(/®/g, "(R)") // Registered trademark symbol
    .replace(/™/g, "(TM)") // Trademark symbol
    .replace(/\\n/g, "\n"); // Newline escape sequence
}
