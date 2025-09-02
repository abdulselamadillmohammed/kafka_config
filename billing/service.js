const { makeKafka } = require("../shared/kafka");
const kafka = makeKafka("billing-svc");

const ordersTopic = "orders.events";
const paymentsTopic = "payments.events";
const groupId = "billing-group";

(async () => {
  const c = kafka.consumer({ groupId });
  const p = kafka.producer();
  await c.connect();
  await p.connect();

  await c.subscribe({ topic: ordersTopic, fromBeginning: false });

  await c.run({
    eachMessage: async ({ message, partition }) => {
      const evt = JSON.parse(message.value.toString());
      if (evt.type === "OrderCreated") {
        const payment = {
          type: "PaymentAuthorized",
          orderId: evt.orderId,
          amount: evt.amount,
          at: new Date().toISOString(),
        };
        const res = await p.send({
          topic: paymentsTopic,
          messages: [
            {
              key: String(payment.orderId),
              value: JSON.stringify(payment),
              partition,
            },
          ],
        });
        console.log(`[Billing] p${partition} authorized ->`, res);
      }
    },
  });
})();
