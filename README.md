# Amazon Connect JSON Generator

A lightweight, interactive tool built with Astro, Alpine.js, and Tailwind CSS that helps you generate Amazon Connect-compatible `SetContactAtrributes` JSON payloads. Designed to simplify the process of manually building attribute blocks for Contact Flows.

---

## ✨ Features

- 🔧 Dynamic form builder to define attribute key/value pairs
- 📋 One-click JSON generation and copy-to-clipboard
- ⚡ Alpine.js-powered toast notifications
- 📚 Template loader for common use cases (basic, routing, test)
- ✅ Responsive UI with clean Tailwind styling

---

## 🧰 Tech Stack

- **Astro** — Modern, fast static site builder
- **Alpine.js** — Lightweight reactivity for interactivity
- **Tailwind CSS** — Utility-first styling
- **TypeScript** — Safe, typed scripting

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/hkbertoson/AWS-Connect-JSON-Generator.git
cd connect-json-generator
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Run Locally

```bash
pnpm dev
# or
npm run dev
```

Then open your browser to: `http://localhost:4321`

---

## 🧪 Usage

1. Use the `+ Add Field` button to create new key/value pairs.
2. Optionally select a predefined template.
3. Click **Generate JSON** to view the Amazon Connect JSON block.
4. Click **Copy JSON** to copy it to your clipboard.
5. Paste directly into an Amazon Connect Contact Flow using the **Set Contact Attributes** block.
