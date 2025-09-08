import json, os, random, time
from kafka import KafkaProducer

BROKER = os.getenv("KAFKA_BROKER", "10.0.0.100:9092")
TOPIC  = os.getenv("TOPIC", "orders.events")

producer = KafkaProducer(
    bootstrap_servers=[BROKER],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

order_id = 1000
print("Random producer running… Ctrl+C to stop.")
while True:
    order_id += 1
    evt = {
        "type": "OrderCreated",
        "orderId": order_id,
        "userId": f"user-{random.randint(1,3)}",
        "amount": random.randint(10, 100),
        "at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    producer.send(TOPIC, value=evt)
    producer.flush()
    print("sent:", evt)

    # 1..10 min (for quick testing, change to 1..5 seconds)
    sleep_sec = random.randint(60, 600)
    time.sleep(sleep_sec)
