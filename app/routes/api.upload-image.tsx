import { ActionFunctionArgs, json } from "@remix-run/node";
import fs from "node:fs/promises";

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.json();

  const pngData = data.imageDataUrl.replace(/^data:image\/png;base64,/, "");

  const path = `/public/uploads/img_${new Date().toISOString()}.png`;
  await fs.writeFile(`${process.cwd()}${path}`, pngData, "base64");

  return json({
    path: path.replace("/public", ""),
  });
}
