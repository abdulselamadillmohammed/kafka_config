require("dotenv").config();
const { Kafka } = require("kafkajs");

const brokers = [process.env.KAFKA_BROKER || "10.0.0.100:9092"];

exports.makeKafka = (clientId) => new Kafka({ clientId, brokers });
