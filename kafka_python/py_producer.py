import json, os, random, time
from kafka import KafkaProducer

BROKER = os.getenv("KAFKA_BROKER", "10.0.0.100:9092")
TOPIC  = os.getenv("TOPIC", "orders.events")

producer = KafkaProducer(
    bootstrap_servers=[BROKER],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

def make_order(i: int):
    return {
        "type": "OrderCreated",
        "orderId": i,
        "userId": f"user-{(i % 3) + 1}",
        "amount": random.randint(10, 100),
        "at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }

if __name__ == "__main__":
    for i in range(1, 6):  # send 5 quick test events
        evt = make_order(i)
        producer.send(TOPIC, value=evt)
        print("sent:", evt)
    producer.flush()
    print("done.")
