import { LoaderFunctionArgs } from "@remix-run/node";
import fs from "node:fs/promises";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const path = `${process.env.DATA_DIR}/uploads/${id}.png`;

  try {
    const file = await fs.readFile(`${process.cwd()}${path}`);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new Response("Image not found", { status: 404 });
  }
}
