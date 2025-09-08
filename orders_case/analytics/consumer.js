const { makeKafka } = require("../shared/kafka");
const kafka = makeKafka("analytics-svc");
const topic = "orders.events";
const groupId = "analytics-group"; // different group

let total = 0;
(async () => {
  const c = kafka.consumer({ groupId });
  await c.connect();
  await c.subscribe({ topic, fromBeginning: true });
  await c.run({
    eachMessage: async ({ message }) => {
      const evt = JSON.parse(message.value.toString());
      if (evt.type === "OrderCreated") {
        total += evt.amount;
        console.log(`[Analytics] total revenue so far = $${total}`);
      }
    },
  });
})();
