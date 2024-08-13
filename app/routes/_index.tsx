/* eslint-disable jsx-a11y/alt-text */
import { json, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Colorful" },
    { name: "description", content: "Colorful - create shareable code snippets" },
  ];
};

export default function Index() {
  return (
    <div
      className="flex flex-col gap-4 h-screen w-screen items-center justify-center"
      style={{
        animation: "rainbow 0.5s linear infinite",
      }}
    >
      <img src="/apple-touch-icon.png" className="animate-bounce" />
      <div className="text-center">
        <p className="mono text-2xl">Colorful</p>
        <small className="text-sm">
          make pretty code snippets on farcaster, by{" "}
          <a href="https://warpcast.com/jtgi" target="_blank" className="underline" rel="noreferrer">
            @jtgi
          </a>
        </small>
      </div>
    </div>
  );
}
