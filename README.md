# kafka_config

A minimal **event-driven architecture** demo using **Apache Kafka** running on a Raspberry Pi 5, with **Node.js microservices** running on macOS.

- **Producer service (Orders):** writes `OrderCreated` events into Kafka.
- **Consumer service (Emailer):** listens to those events and “sends emails.”
- Can easily be extended with **Analytics** (fan-out) or **Billing/Accounting** (chained events).

> **Credits:** Inspired by  
> [Apache Kafka Crash Course – Hussein Nasser](https://youtu.be/R873BlNVUB4?si=-mx8jLqvNJsHUcNE)

---

## Why Kafka?

- **Decoupling:** Services don’t need to know about each other — they just push/pull from Kafka.
- **Scalability:** Topics are split into **partitions**, so multiple consumers can work in parallel.
- **Load balancing:** Consumers in the same group automatically split the workload (rebalance).
- **Fan-out (pub/sub):** Consumers in _different_ groups all get the full stream of events.
- **Replay:** Consumers can start from the beginning and reprocess history.

---

## Setup

### 1. Raspberry Pi (Kafka broker)

1. Install Docker & Docker Compose.
2. Clone this repo onto the Pi.
3. Create a `.env` file in the Pi project folder with your Pi’s LAN IP:

   ```ini
   HOST_IP=10.0.0.100
   ```

4. Start Kafka and ZooKeeper:

   ```bash
   docker compose up -d
   docker compose ps
   ```

5. Create a topic for orders:

   ```bash
   docker exec -it kafka /opt/bitnami/kafka/bin/kafka-topics.sh \
     --bootstrap-server localhost:9092 --create \
     --topic orders.events --partitions 2 --replication-factor 1
   ```

---

### 2. macOS (Node.js microservices)

1. Make sure you have Node.js >= 16 installed.

2. Clone this repo onto your Mac.

3. Create a `.env` file in the root of the project:

   ```ini
   KAFKA_BROKER=10.0.0.100:9092
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Run the services:

   - **Producer (Orders):**

     ```bash
     node orders/producer.js 5
     ```

     → Sends 5 `OrderCreated` events to Kafka.

   - **Consumer (Emailer):**

     ```bash
     node emailer/consumer.js
     ```

     → Receives events and prints “sending email” logs.

---

## Demos

- **Load balancing:**
  Start two Emailer consumers with the same group ID:

  ```bash
  node emailer/consumer.js
  node emailer/consumer.js
  ```

  Kafka automatically splits partitions between them.

- **Fan-out (pub/sub):**
  Start an **Analytics** consumer with a different group ID:

  ```bash
  node analytics/consumer.js
  ```

  Both Emailer and Analytics will receive _all_ events.

- **Replay:**
  Consumers can be run with `fromBeginning: true` to reprocess history.

---

## Useful commands (on Pi)

- List topics:

  ```bash
  docker exec -it kafka /opt/bitnami/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 --list
  ```

- Inspect consumer groups:

  ```bash
  docker exec -it kafka /opt/bitnami/kafka/bin/kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 --list
  ```

- Describe a group (check offsets/lag):

  ```bash
  docker exec -it kafka /opt/bitnami/kafka/bin/kafka-consumer-groups.sh \
    --bootstrap-server localhost:9092 --describe --group emailer-group
  ```

---

## License & Credits

- This repo is for educational/demo purposes.
- **Credit:** [Apache Kafka Crash Course – Hussein Nasser](https://youtu.be/R873BlNVUB4?si=-mx8jLqvNJsHUcNE)
