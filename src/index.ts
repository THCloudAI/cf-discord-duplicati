import { Router } from 'itty-router';
import { createEmbed } from './utils';

// Create a new router
const router = Router();

/*
Our index route, a simple hello world.
*/
router.get("/", () => {
  return new Response("Hello World");
});

router.post("/api/:name/:channel/:webhook", async (request) => {
  const { name, channel, webhook } = request.params as { [key: string]: string };
  const webhookUrl = `https://discord.com/api/webhooks/${channel}/${webhook}`;

  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ status: 404, message: "No content provided" }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
  }

  const body = await request.json();
  const discordPayload = createEmbed(decodeURIComponent(name), body.Data);

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload),
  });

  if (res.status !== 200 && res.status !== 204) {
    return new Response(JSON.stringify({ status: res.status, message: res.statusText }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    });
  }

  return new Response(JSON.stringify({ status: 200, message: 'Discord webhook triggered' }), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });
});

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).
*/
router.all("*", () => new Response("404, not found!", { status: 404 }));

/*
This snippet ties our worker to the router we defined above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
export default {
  fetch: router.handle,
};