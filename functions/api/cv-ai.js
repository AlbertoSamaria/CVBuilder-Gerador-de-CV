import handler from "../../netlify/functions/cv-ai.mjs";

export async function onRequest(context) {
  return handler(context.request);
}
