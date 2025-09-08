import json, os
from kafka import KafkaConsumer

BROKER = os.getenv("KAFKA_BROKER", "10.0.0.100:9092")
TOPIC  = os.getenv("TOPIC", "orders.events")
GROUP  = os.getenv("GROUP_ID", "py-consumer-group")

consumer = KafkaConsumer(
    TOPIC,
    bootstrap_servers=[BROKER],
    group_id=GROUP,                 # coordinated consumer group
    enable_auto_commit=True,
    auto_offset_reset="latest",     # "earliest" to replay history
    value_deserializer=lambda b: json.loads(b.decode("utf-8")),
)

print(f"Listening on {BROKER} topic={TOPIC} group={GROUP} …")
for msg in consumer:
    e = msg.value
    print(f"p{msg.partition} offset={msg.offset} -> {e}")
