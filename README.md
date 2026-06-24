# 🧠 Agentic Inventory Replenishment System

An intelligent, event-driven inventory management system that analyzes sales data, predicts stock risk, and automatically triggers AI-powered replenishment decisions.

---

## 🚀 Overview

This project simulates a real-world inventory system (like Amazon/Flipkart) where:

* Orders drive demand signals
* System calculates stock health in real-time
* AI decides when and how much to reorder
* Events trigger asynchronous processing via queues

---

## 🏗️ Architecture

```
Orders + Inventory (MongoDB)
        ↓
Metrics Engine (Demand Analysis)
        ↓
Decision Engine (Rule-Based)
        ↓
AI Agent (LLM via Ollama)
        ↓
AWS SQS Queue
        ↓
Worker Service (Async Processing)
        ↓
Replenishment Logs (MongoDB)
```

---

## ⚙️ Tech Stack

* **Backend:** Node.js, Express
* **Database:** MongoDB
* **Queue System:** AWS SQS
* **AI Layer:** Ollama (LLaMA3 / Open Source LLM)
* **Architecture:** Event-driven, asynchronous processing

---

## 🔥 Key Features

* 📊 **Demand Analytics**

  * Computes avg daily sales, stock levels, days of inventory

* 🧠 **Decision Engine**

  * Calculates reorder quantity using lead time + safety stock

* 🤖 **AI-Powered Recommendations**

  * Enhances decisions with reasoning using LLMs

* ⚡ **Event-Driven System**

  * Uses AWS SQS to process inventory decisions asynchronously

* 📦 **Scalable Architecture**

  * Decoupled services (Producer → Queue → Worker)

---

## 🔄 System Flow

1. New order is created
2. Event is sent to SQS queue
3. Worker consumes message
4. Metrics are calculated
5. AI generates replenishment decision
6. Decision is stored in database

---

## 📡 API Endpoints

### 📊 Get Product Metrics

```
GET /metrics/:productId
```

### 🧠 Get Replenishment Decision (Rule-based)

```
GET /replenish/:productId
```

### 🤖 Get AI-Based Decision

```
GET /ai-replenish/:productId
```

### 📜 Get Decision Logs

```
GET /logs/:productId
```

---

## 🧪 Sample Output

```json
{
  "productId": "123",
  "decision": "REORDER",
  "recommendedQty": 150,
  "urgency": "HIGH",
  "reason": "High demand and low stock"
}
```

---

## 🛠️ Setup Instructions

### 1. Clone the repo

```
git clone https://github.com/your-username/inventory-system.git
cd inventory-system
```

### 2. Install dependencies

```
npm install
```

### 3. Setup environment variables

Create a `.env` file:

```
MONGO_URI=your_mongodb_url
AWS_REGION=ap-south-1
SQS_QUEUE_URL=your_sqs_queue_url
```

### 4. Start services

Run backend:

```
npm start
```

Run worker:

```
node src/workers/sqsWorker.js
```

---

## 🧠 What Makes This Project Unique?

* Combines **backend engineering + system design + AI**
* Implements **event-driven architecture using AWS SQS**
* Uses **LLM reasoning instead of static rules**
* Simulates **real-world inventory systems used by e-commerce companies**

---

## 📈 Future Improvements

* Demand trend prediction (time-series)
* Multi-warehouse support
* Real-time dashboard (React)
* Deployment on AWS (EC2, Lambda)

---

## 👨‍💻 Author

**Sanjay Kulkarni**
Full Stack Developer

---

## ⭐ If you like this project

Give it a star ⭐ and feel free to contribute!
