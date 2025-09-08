const { makeKafka } = require("../shared/kafka");
const kafka = makeKafka("accounting-svc");
const topic = "payments.events";
const groupId = "accounting-group";

(async () => {
  const c = kafka.consumer({ groupId });
  await c.connect();
  await c.subscribe({ topic, fromBeginning: true });
  await c.run({
    eachMessage: async ({ partition, message }) => {
      const evt = JSON.parse(message.value.toString());
      if (evt.type === "PaymentAuthorized") {
        console.log(
          `[Accounting] p${partition} -> record payment for order ${evt.orderId} $${evt.amount}`
        );
      }
    },
  });
})();
