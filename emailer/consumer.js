const { makeKafka } = require("../shared/kafka");
const kafka = makeKafka("emailer-svc");
const topic = "orders.events";
const groupId = "emailer-group"; // scale by starting more processes with same groupId

(async () => {
  const c = kafka.consumer({ groupId });
  await c.connect();
  await c.subscribe({ topic, fromBeginning: true });

  await c.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      if (event.type === "OrderCreated") {
        console.log(
          `[Emailer] p${partition} -> email user=${event.userId} about order=${event.orderId} $${event.amount}`
        );
      }
    },
  });
})();
