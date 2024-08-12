import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/default.css"; // Import the default Highlight.js style
import { hostUrl } from "~/lib/env.server";
import html2canvas from "html2canvas";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const state = JSON.parse(decodeURIComponent(url.searchParams.get("state") ?? ""));

  return { state, hostUrl };
}

export async function action() {}

export default function Screen() {
  const { state, hostUrl: _hostUrl } = useLoaderData<typeof loader>();

  useEffect(() => {
    const nodes = document.querySelectorAll("pre code");
    nodes.forEach((node) => hljs.highlightBlock(node as HTMLElement));
  }, []);

  const handleFinish = async () => {
    const node = document.querySelector("pre code");
    if (!node) {
      return;
    }

    const canvas = await html2canvas(node as HTMLElement);
    const dataUrl = canvas.toDataURL("image/png");
    console.log(dataUrl);
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

    window.parent.postMessage(
      {
        type: "createCast",
        data: {
          cast: {
            text: `pasted back: ${state.cast.text}`,
            embeds: [url],
          },
        },
      },
      "*"
    );
  };

  return (
    <div>
      <pre>
        <code>{state.cast.text}</code>
      </pre>
      <button onClick={handleFinish}>Finish</button>
    </div>
  );
}
