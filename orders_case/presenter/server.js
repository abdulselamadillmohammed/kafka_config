require("dotenv").config();
const express = require("express");
const path = require("path");
const { Kafka } = require("kafkajs");

const PORT = process.env.PORT || 3000;
const BROKERS = [process.env.KAFKA_BROKER || "10.0.0.100:9092"];
const TOPIC = "orders.events";

const app = express();

// serve the static page
app.use(express.static(path.join(__dirname, "public")));

// SSE endpoint
const clients = new Set();
app.get("/orders-stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(": connected\n\n"); // comment line to keep connection alive
  clients.add(res);
  req.on("close", () => clients.delete(res));
});

// Kafka consumer → fan out to all SSE clients
(async () => {
  const kafka = new Kafka({ clientId: "presenter", brokers: BROKERS });
  const consumer = kafka.consumer({ groupId: "presenter-group" });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false }); // change to true to replay history

  await consumer.run({
    eachMessage: async ({ message, partition }) => {
      const payload = message.value?.toString() || "";
      const event = payload || JSON.stringify({ note: "empty message" });
      const data = JSON.stringify({ partition, ...JSON.parse(event) });
      for (const res of clients) {
        res.write(`data: ${data}\n\n`);
      }
    },
  });
})().catch((err) => {
  console.error("Kafka consumer failed:", err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Presenter up at http://localhost:${PORT}`);
});
