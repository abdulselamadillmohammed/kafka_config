require("dotenv").config();
const express = require("express");
const path = require("path");
const { Kafka } = require("kafkajs");

const PORT = process.env.PORT || 3000;
const BROKER = process.env.KAFKA_BROKER || "10.0.0.100:9092";
const TOPIC = process.env.TOPIC || "orders.events";
const GROUP = process.env.GROUP_ID || "viewer-group";

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// SSE clients
const clients = new Set();
app.get("/orders-stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n");
  clients.add(res);
  req.on("close", () => clients.delete(res));
});

(async () => {
  const kafka = new Kafka({
    clientId: `orders-viewer-${PORT}`,
    brokers: [BROKER],
  });
  const consumer = kafka.consumer({ groupId: GROUP });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const val = message.value ? message.value.toString() : "{}";
      // forward to all connected browsers
      for (const res of clients)
        res.write(
          `data: ${JSON.stringify({ partition, ...safeJson(val) })}\n\n`
        );
      // optional: also log to stdout
      console.log(`p${partition} -> ${val}`);
    },
  });

  console.log(
    `Kafka consumer up: topic=${TOPIC} group=${GROUP} broker=${BROKER}`
  );
})().catch((err) => {
  console.error("Kafka consumer failed:", err);
  process.exit(1);
});

app.listen(PORT, () =>
  console.log(`Orders Viewer at http://localhost:${PORT}`)
);

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}
