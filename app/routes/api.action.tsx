import { ActionFunctionArgs, json } from "@remix-run/node";
import { hostUrl } from "~/lib/env.server";

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.json();

  return json({
    type: "form",
    title: "Colorful",
    url: `${hostUrl}/format?state=${data.untrustedData.state}`,
  });
}
