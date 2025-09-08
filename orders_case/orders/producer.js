const { makeKafka } = require("../shared/kafka");
const kafka = makeKafka("orders-svc");
const topic = "orders.events";

const pickPartition = (orderId) => (orderId % 2 === 0 ? 0 : 1);

(async () => {
  const p = kafka.producer();
  await p.connect();

  const N = Number(process.argv[2] || 5); // how many fake orders to emit (default = 5)
  for (let i = 1; i <= N; i++) {
    const event = {
      type: "OrderCreated",
      orderId: i,
      userId: `user-${((i - 1) % 3) + 1}`,
      amount: Math.floor(Math.random() * 90) + 10,
      at: new Date().toISOString(),
    };
    const partition = pickPartition(i);
    const res = await p.send({
      topic,
      messages: [
        { key: String(event.orderId), value: JSON.stringify(event), partition },
      ],
    });
    console.log("Produced", event, "->", res);
  }

  await p.disconnect();
})();
