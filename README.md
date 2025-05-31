# TruthLens - AI Fact Checker

## Overview

**TruthLens** is an AI-powered fact-checking tool that helps users verify claims in real-time using Natural Language Processing (NLP), multi-source cross-verification, and credibility scoring. It aims to combat misinformation by providing transparent, data-backed insights into online content.

---

## 🔍 Core Features

### 🧠 Real-Time Claim Detection & Extraction
- Automatically extracts key claims and facts from social media posts, news articles, and online content.
- Utilizes advanced NLP techniques like Named Entity Recognition (NER) and ClaimSpotting.

### 📊 Credibility Score Generation
- Assigns a credibility score based on:
  - Source trustworthiness
  - Cross-verification with multiple sources
  - Historical accuracy of the source
- Displays verified fact-check links, sources, and the AI’s reasoning behind each score.

### 🧾 Evidence Dashboard
- Provides side-by-side comparisons: **Claim vs Verified Data**
- Includes:
  - Links to verified sources
  - Visual credibility indicators (color-coded risk levels: 🟢 Green, 🟡 Yellow, 🔴 Red)

### 🤖 Chat Bot
- Tracks the origin and spread of claims.
- Exposes manipulated trends and fake campaigns through conversational interaction.

### 🌐 Browser Extension
- Chrome extension to fact-check claims directly within the browser.
- Automatically alerts users when suspicious content is detected.

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.x
- Chrome (for the browser extension)

### Steps to Run Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/TruthLens.git
   cd TruthLens
