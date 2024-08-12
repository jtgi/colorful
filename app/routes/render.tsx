import { json, LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const dataUrl = url.searchParams.get("dataUrl");

  if (!dataUrl) {
    return json(
      {
        error: "No dataUrl provided",
      },
      {
        status: 400,
      }
    );
  }

  const data = decodeURIComponent(dataUrl);
  console.log(data);
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
}
