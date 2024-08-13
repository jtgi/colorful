import { v4 as uuidv4 } from "uuid";
import { ActionFunctionArgs, json } from "@remix-run/node";
import fs from "node:fs/promises";

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.json();

  const pngData = data.imageDataUrl.replace(/^data:image\/png;base64,/, "");

  const uniqueId = uuidv4();
  const path = `${process.env.DATA_DIR}/uploads/${uniqueId}.png`;
  await fs.writeFile(`${process.cwd()}${path}`, pngData, "base64");

  return json({
    path: path.replace(process.env.DATA_DIR!, ""),
  });
}
