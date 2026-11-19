import handler from "../../netlify/functions/canva.mjs";

export async function onRequest(context) {
  return handler(context.request);
}
